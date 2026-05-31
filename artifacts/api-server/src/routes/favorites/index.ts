import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";
import { db, promptsTable, favoritesTable } from "@workspace/db";
import {
  AddFavoriteBody,
  RemoveFavoriteParams,
} from "@workspace/api-zod";

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

router.get("/favorites", requireAuth, async (req: any, res): Promise<void> => {
  const favs = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, req.userId))
    .orderBy(desc(favoritesTable.createdAt));

  if (favs.length === 0) {
    res.json([]);
    return;
  }

  const promptIds = favs.map((f) => f.promptId);
  const prompts = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.userId, req.userId));

  const promptMap = new Map(prompts.map((p) => [p.id, p]));
  const result = promptIds
    .map((id) => promptMap.get(id))
    .filter(Boolean)
    .map((p) => ({ ...p!, isFavorited: true }));

  res.json(result);
});

router.post("/favorites", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, req.userId),
        eq(favoritesTable.promptId, parsed.data.promptId),
      ),
    );

  if (existing.length === 0) {
    await db.insert(favoritesTable).values({
      userId: req.userId,
      promptId: parsed.data.promptId,
    });
  }

  res.status(201).json({ promptId: parsed.data.promptId, favorited: true });
});

router.delete("/favorites/:promptId", requireAuth, async (req: any, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, req.userId),
        eq(favoritesTable.promptId, params.data.promptId),
      ),
    );

  res.sendStatus(204);
});

export default router;
