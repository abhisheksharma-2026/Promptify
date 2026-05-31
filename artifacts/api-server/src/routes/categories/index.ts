import { Router, type IRouter } from "express";
import { db, categoriesTable, promptsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable);

  const counts = await db
    .select({
      category: promptsTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(promptsTable)
    .groupBy(promptsTable.category);

  const countMap = new Map(counts.map((c) => [c.category, c.count]));

  res.json(
    cats.map((c) => ({
      ...c,
      promptCount: countMap.get(c.slug) ?? 0,
    })),
  );
});

export default router;
