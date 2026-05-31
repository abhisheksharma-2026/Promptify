import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import type { User } from "@workspace/db";

export class PaymentStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }

  async upsertUser(id: string, email?: string): Promise<User> {
    const [user] = await db
      .insert(usersTable)
      .values({ id, email: email ?? null })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: { updatedAt: new Date(), ...(email ? { email } : {}) },
      })
      .returning();
    return user;
  }

  async updateUserStripe(userId: string, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    plan?: string;
    planInterval?: string;
  }): Promise<User> {
    const [user] = await db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    return user;
  }

  async updateUserRazorpay(userId: string, data: {
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string | null;
    plan?: string;
    planInterval?: string;
  }): Promise<User> {
    const [user] = await db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    return user;
  }

  async setUserPlan(userId: string, plan: string, planInterval: string, currency: string): Promise<User> {
    const [user] = await db
      .update(usersTable)
      .set({ plan, planInterval, currency, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    return user;
  }

  async getStripeInvoices(stripeCustomerId: string): Promise<any[]> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.invoices WHERE customer = ${stripeCustomerId} ORDER BY created DESC LIMIT 20`
      );
      return result.rows as any[];
    } catch {
      return [];
    }
  }

  async getStripeSubscription(subscriptionId: string): Promise<any> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
      );
      return result.rows[0] ?? null;
    } catch {
      return null;
    }
  }
}

export const paymentStorage = new PaymentStorage();
