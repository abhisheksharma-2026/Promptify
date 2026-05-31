import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, desc, gte, sql, and } from "drizzle-orm";
import { db, promptsTable, favoritesTable } from "@workspace/db";

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

router.get("/stats/dashboard", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;

  const [totalPromptsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(promptsTable)
    .where(eq(promptsTable.userId, userId));

  const [totalFavoritesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));

  const [totalCopiesRow] = await db
    .select({ total: sql<number>`coalesce(sum(copy_count), 0)::int` })
    .from(promptsTable)
    .where(eq(promptsTable.userId, userId));

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const [weekRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(promptsTable)
    .where(and(eq(promptsTable.userId, userId), gte(promptsTable.createdAt, oneWeekAgo)));

  const categoryRows = await db
    .select({
      category: promptsTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(promptsTable)
    .where(eq(promptsTable.userId, userId))
    .groupBy(promptsTable.category)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  const [avgRow] = await db
    .select({ avg: sql<number>`avg(quality_score)` })
    .from(promptsTable)
    .where(eq(promptsTable.userId, userId));

  const recentPrompts = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.userId, userId))
    .orderBy(desc(promptsTable.createdAt))
    .limit(5);

  const favs = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  const favSet = new Set(favs.map((f) => f.promptId));

  res.json({
    totalPrompts: totalPromptsRow?.count ?? 0,
    totalFavorites: totalFavoritesRow?.count ?? 0,
    totalCopies: totalCopiesRow?.total ?? 0,
    promptsThisWeek: weekRow?.count ?? 0,
    topCategory: categoryRows[0]?.category ?? null,
    avgQualityScore: avgRow?.avg ? parseFloat(avgRow.avg.toFixed(1)) : null,
    recentPrompts: recentPrompts.map((p) => ({ ...p, isFavorited: favSet.has(p.id) })),
  });
});

router.get("/stats/trending", async (_req, res): Promise<void> => {
  const trending = await db
    .select()
    .from(promptsTable)
    .orderBy(desc(promptsTable.copyCount))
    .limit(10);

  res.json(trending.map((p) => ({ ...p, isFavorited: false })));
});

export default router;
