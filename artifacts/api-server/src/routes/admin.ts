import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin";
import { db } from "@workspace/db";
import { usersTable, promptsTable, favoritesTable } from "@workspace/db";
import { sql, count, desc } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

// All admin routes require admin auth
router.use(requireAdmin);

// GET /api/admin/overview — top-level KPIs
router.get("/admin/overview", async (req: any, res) => {
  try {
    const [totalUsers] = await db.select({ count: count() }).from(usersTable);
    const [totalPrompts] = await db.select({ count: count() }).from(promptsTable);
    const [totalFavorites] = await db.select({ count: count() }).from(favoritesTable);

    // Plan distribution
    const planRows = await db.execute(
      sql`SELECT plan, COUNT(*) as user_count FROM users GROUP BY plan ORDER BY user_count DESC`
    );

    // Currency distribution
    const currencyRows = await db.execute(
      sql`SELECT currency, COUNT(*) as user_count FROM users GROUP BY currency`
    );

    // Active paid subscriptions (non-free)
    const paidUsersResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM users WHERE plan != 'free'`
    );
    const paidUsers = ((paidUsersResult as any).rows ?? paidUsersResult)[0];

    // New users last 7 days
    const newUsers7dResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'`
    );
    const newUsers7d = ((newUsers7dResult as any).rows ?? newUsers7dResult)[0];

    // New prompts last 7 days
    const newPrompts7dResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM prompts WHERE created_at > NOW() - INTERVAL '7 days'`
    );
    const newPrompts7d = ((newPrompts7dResult as any).rows ?? newPrompts7dResult)[0];

    res.json({
      totalUsers: Number(totalUsers.count),
      totalPrompts: Number(totalPrompts.count),
      totalFavorites: Number(totalFavorites.count),
      paidUsers: Number((paidUsers as any).count),
      newUsers7d: Number((newUsers7d as any).count),
      newPrompts7d: Number((newPrompts7d as any).count),
      planDistribution: (planRows as any).rows ?? planRows,
      currencyDistribution: (currencyRows as any).rows ?? currencyRows,
    });
  } catch (err: any) {
    req.log?.error({ err }, "Admin overview error");
    res.status(500).json({ error: "Failed to load overview" });
  }
});

// GET /api/admin/users — paginated user list with plan info
router.get("/admin/users", async (req: any, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const offset = Number(req.query.offset ?? 0);

    const users = await db.execute(
      sql`
        SELECT 
          u.id,
          u.email,
          u.plan,
          u.plan_interval,
          u.currency,
          u.created_at,
          COUNT(DISTINCT p.id) as prompt_count
        FROM users u
        LEFT JOIN prompts p ON p.user_id = u.id
        GROUP BY u.id, u.email, u.plan, u.plan_interval, u.currency, u.created_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    );

    const [total] = await db.select({ count: count() }).from(usersTable);

    res.json({
      users: (users as any).rows ?? users,
      total: Number(total.count),
      limit,
      offset,
    });
  } catch (err: any) {
    req.log?.error({ err }, "Admin users error");
    res.status(500).json({ error: "Failed to load users" });
  }
});

// GET /api/admin/revenue — MRR breakdown from Stripe
router.get("/admin/revenue", async (req: any, res) => {
  try {
    // Stripe MRR from subscriptions in stripe schema
    let stripeRevenue = { mrr: 0, total: 0, subscriptions: 0 };
    try {
      const subRows = await db.execute(
        sql`SELECT COUNT(*) as count, COALESCE(SUM(CAST(items->0->>'price' AS TEXT)), '0') as revenue
            FROM stripe.subscriptions WHERE status = 'active'`
      );
      stripeRevenue.subscriptions = Number(((subRows as any).rows?.[0])?.count ?? 0);
    } catch {
      // stripe schema may not exist yet
    }

    // INR revenue from razorpay users (estimate from plan)
    const inrRevRows = await db.execute(
      sql`SELECT plan, plan_interval, COUNT(*) as cnt
          FROM users WHERE currency = 'inr' AND plan != 'free'
          GROUP BY plan, plan_interval`
    );

    const INR_PRICES: Record<string, Record<string, number>> = {
      starter: { monthly: 199, yearly: 1910 / 12 },
      pro: { monthly: 499, yearly: 4790 / 12 },
      team: { monthly: 1999, yearly: 19190 / 12 },
      enterprise: { monthly: 2999, yearly: 28790 / 12 },
    };

    const USD_PRICES: Record<string, Record<string, number>> = {
      starter: { monthly: 9, yearly: 86 / 12 },
      pro: { monthly: 19, yearly: 182 / 12 },
      team: { monthly: 49, yearly: 470 / 12 },
      enterprise: { monthly: 199, yearly: 1910 / 12 },
    };

    let inrMrr = 0;
    for (const row of ((inrRevRows as any).rows ?? inrRevRows) as any[]) {
      const price = INR_PRICES[row.plan]?.[row.plan_interval] ?? 0;
      inrMrr += price * Number(row.cnt);
    }

    const usdRevRows = await db.execute(
      sql`SELECT plan, plan_interval, COUNT(*) as cnt
          FROM users WHERE currency = 'usd' AND plan != 'free'
          GROUP BY plan, plan_interval`
    );

    let usdMrr = 0;
    for (const row of ((usdRevRows as any).rows ?? usdRevRows) as any[]) {
      const price = USD_PRICES[row.plan]?.[row.plan_interval] ?? 0;
      usdMrr += price * Number(row.cnt);
    }

    res.json({
      usdMrr: Math.round(usdMrr * 100) / 100,
      inrMrr: Math.round(inrMrr),
      stripeSubscriptions: stripeRevenue.subscriptions,
    });
  } catch (err: any) {
    req.log?.error({ err }, "Admin revenue error");
    res.status(500).json({ error: "Failed to load revenue" });
  }
});

// GET /api/admin/activity — prompts created per day for last 30 days
router.get("/admin/activity", async (req: any, res) => {
  try {
    const rows = await db.execute(
      sql`
        SELECT 
          DATE_TRUNC('day', created_at) as day,
          COUNT(*) as prompts
        FROM prompts
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `
    );

    const userRows = await db.execute(
      sql`
        SELECT 
          DATE_TRUNC('day', created_at) as day,
          COUNT(*) as signups
        FROM users
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `
    );

    res.json({
      promptActivity: (rows as any).rows ?? rows,
      signupActivity: (userRows as any).rows ?? userRows,
    });
  } catch (err: any) {
    req.log?.error({ err }, "Admin activity error");
    res.status(500).json({ error: "Failed to load activity" });
  }
});

// GET /api/admin/whoami — returns the admin user ID so the FE can compare
router.get("/admin/whoami", async (req: any, res) => {
  res.json({ adminUserId: req.auth.userId });
});

export default router;
