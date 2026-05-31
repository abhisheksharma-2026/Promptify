import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { db, promptsTable, favoritesTable, promptVersionsTable } from "@workspace/db";
import {
  ListPromptsQueryParams,
  CreatePromptBody,
  GetPromptParams,
  UpdatePromptParams,
  UpdatePromptBody,
  DeletePromptParams,
  GeneratePromptBody,
  IteratePromptBody,
} from "@workspace/api-zod";
import { generatePromptStream, iteratePromptStream } from "../../lib/apex";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

function parseIntParam(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.get("/prompts", requireAuth, async (req: any, res): Promise<void> => {
  const params = ListPromptsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [eq(promptsTable.userId, req.userId)];
  if (params.data.category) {
    conditions.push(eq(promptsTable.category, params.data.category));
  }
  if (params.data.search) {
    conditions.push(ilike(promptsTable.title, `%${params.data.search}%`));
  }

  const prompts = await db
    .select()
    .from(promptsTable)
    .where(and(...conditions))
    .orderBy(desc(promptsTable.createdAt));

  const favorites = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.userId));
  const favSet = new Set(favorites.map((f) => f.promptId));

  res.json(prompts.map((p) => ({ ...p, isFavorited: favSet.has(p.id) })));
});

router.post("/prompts", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prompt] = await db
    .insert(promptsTable)
    .values({ ...parsed.data, userId: req.userId })
    .returning();

  await db.insert(promptVersionsTable).values({
    promptId: prompt.id,
    content: prompt.content,
    qualityScore: prompt.qualityScore,
    action: "create",
    versionNumber: 1,
  });

  res.status(201).json({ ...prompt, isFavorited: false });
});

router.post("/prompts/generate", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = GeneratePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await generatePromptStream(parsed.data, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Error generating prompt");
    res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
  }
  res.end();
});

router.post("/prompts/iterate", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = IteratePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await iteratePromptStream(parsed.data, (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Error iterating prompt");
    res.write(`data: ${JSON.stringify({ error: "Iteration failed" })}\n\n`);
  }
  res.end();
});

router.get("/prompts/:id/versions", requireAuth, async (req: any, res): Promise<void> => {
  const id = parseIntParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid prompt id" });
    return;
  }

  const [prompt] = await db
    .select()
    .from(promptsTable)
    .where(and(eq(promptsTable.id, id), eq(promptsTable.userId, req.userId)));

  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  const versions = await db
    .select()
    .from(promptVersionsTable)
    .where(eq(promptVersionsTable.promptId, id))
    .orderBy(desc(promptVersionsTable.versionNumber));

  res.json(versions);
});

router.post("/prompts/:id/versions/:versionId/restore", requireAuth, async (req: any, res): Promise<void> => {
  const id = parseIntParam(req.params.id);
  const versionId = parseIntParam(req.params.versionId);
  if (!id || !versionId) {
    res.status(400).json({ error: "Invalid id or versionId" });
    return;
  }

  const [prompt] = await db
    .select()
    .from(promptsTable)
    .where(and(eq(promptsTable.id, id), eq(promptsTable.userId, req.userId)));

  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  const [version] = await db
    .select()
    .from(promptVersionsTable)
    .where(
      and(
        eq(promptVersionsTable.id, versionId),
        eq(promptVersionsTable.promptId, id),
      ),
    );

  if (!version) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  const [maxRow] = await db
    .select({ max: sql<number>`max(version_number)::int` })
    .from(promptVersionsTable)
    .where(eq(promptVersionsTable.promptId, id));

  const nextVersion = (maxRow?.max ?? 0) + 1;

  await db.insert(promptVersionsTable).values({
    promptId: id,
    content: version.content,
    qualityScore: version.qualityScore,
    action: `restore_v${version.versionNumber}`,
    versionNumber: nextVersion,
  });

  const [updated] = await db
    .update(promptsTable)
    .set({
      content: version.content,
      qualityScore: version.qualityScore,
      updatedAt: new Date(),
    })
    .where(eq(promptsTable.id, id))
    .returning();

  const [fav] = await db
    .select()
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.promptId, id)));

  res.json({ ...updated, isFavorited: !!fav });
});

router.get("/prompts/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetPromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prompt] = await db
    .select()
    .from(promptsTable)
    .where(and(eq(promptsTable.id, params.data.id), eq(promptsTable.userId, req.userId)));

  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  const [fav] = await db
    .select()
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, req.userId), eq(favoritesTable.promptId, prompt.id)));

  res.json({ ...prompt, isFavorited: !!fav });
});

router.patch("/prompts/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdatePromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.content) {
    const [maxRow] = await db
      .select({ max: sql<number>`max(version_number)::int` })
      .from(promptVersionsTable)
      .where(eq(promptVersionsTable.promptId, params.data.id));

    const nextVersion = (maxRow?.max ?? 0) + 1;
    await db.insert(promptVersionsTable).values({
      promptId: params.data.id,
      content: parsed.data.content,
      qualityScore: undefined,
      action: "edit",
      versionNumber: nextVersion,
    });
  }

  const [prompt] = await db
    .update(promptsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(promptsTable.id, params.data.id), eq(promptsTable.userId, req.userId)))
    .returning();

  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  res.json({ ...prompt, isFavorited: false });
});

router.delete("/prompts/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeletePromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(promptsTable)
    .where(and(eq(promptsTable.id, params.data.id), eq(promptsTable.userId, req.userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
