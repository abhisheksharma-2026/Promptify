import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middlewares/requireAuth";
import { paymentStorage } from "../paymentStorage";
import { getUncachableStripeClient } from "../stripeClient";
import { getRazorpayClient, getRazorpayKeyId } from "../razorpayClient";
import { getPlansForCurrency } from "../pricingConfig";
import { getCurrencyForRequest, detectCountry } from "../countryDetect";

const router = Router();

router.get("/pricing", async (req, res) => {
  const currencyOverride = req.query.currency as string | undefined;
  const currency = getCurrencyForRequest(req, currencyOverride);
  const country = detectCountry(req);
  const plans = getPlansForCurrency(currency);
  res.json({ plans, currency, country, isIndia: currency === "inr" });
});

router.get("/billing/me", requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;
  const user = await paymentStorage.getUser(userId);
  if (!user) {
    res.json({ plan: "free", currency: "usd", subscription: null, invoices: [] });
    return;
  }

  let subscription: any = null;
  let invoices: any[] = [];

  if (user.stripeSubscriptionId) {
    try {
      const stripe = await getUncachableStripeClient();
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      subscription = {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        gateway: "stripe",
      };
      const invoiceList = await stripe.invoices.list({
        customer: user.stripeCustomerId!,
        limit: 10,
      });
      invoices = invoiceList.data.map((inv) => ({
        id: inv.id,
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        status: inv.status,
        date: new Date(inv.created * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
      }));
    } catch (err: any) {
      req.log?.warn({ err }, "Failed to fetch Stripe subscription details");
    }
  } else if (user.razorpaySubscriptionId) {
    try {
      const rzp = getRazorpayClient();
      const sub = await rzp.subscriptions.fetch(user.razorpaySubscriptionId);
      subscription = {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: new Date((sub as any).current_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.status === "cancelled",
        gateway: "razorpay",
      };
    } catch (err: any) {
      req.log?.warn({ err }, "Failed to fetch Razorpay subscription details");
    }
  }

  res.json({
    plan: user.plan,
    planInterval: user.planInterval,
    currency: user.currency,
    subscription,
    invoices,
  });
});

router.post("/billing/stripe/checkout", requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;
  const { planId, interval } = req.body as { planId: string; interval: "monthly" | "yearly" };

  const user = await paymentStorage.upsertUser(userId, req.auth.sessionClaims?.email as string);
  const stripe = await getUncachableStripeClient();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await paymentStorage.updateUserStripe(userId, { stripeCustomerId: customerId });
  }

  const host = `${req.protocol}://${req.get("host")}`;
  const basePath = process.env.BASE_PATH ?? "";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Promptify ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            metadata: { planId, interval },
          },
          unit_amount: getPriceInCents(planId, interval),
          recurring: { interval: interval === "yearly" ? "year" : "month" },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    subscription_data: {
      metadata: { userId, planId, interval },
    },
    success_url: `${host}${basePath}/billing?success=1`,
    cancel_url: `${host}${basePath}/pricing`,
  });

  res.json({ url: session.url });
});

router.post("/billing/stripe/portal", requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;
  const user = await paymentStorage.getUser(userId);

  if (!user?.stripeCustomerId) {
    res.status(400).json({ error: "No Stripe customer found" });
    return;
  }

  const stripe = await getUncachableStripeClient();
  const host = `${req.protocol}://${req.get("host")}`;
  const basePath = process.env.BASE_PATH ?? "";

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${host}${basePath}/billing`,
  });

  res.json({ url: session.url });
});

router.post("/billing/razorpay/create-order", requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;
  const { planId, interval } = req.body as { planId: string; interval: "monthly" | "yearly" };

  const user = await paymentStorage.upsertUser(userId, req.auth.sessionClaims?.email as string);
  const rzp = getRazorpayClient();
  const amount = getPriceInPaise(planId, interval);

  const order = await rzp.orders.create({
    amount,
    currency: "INR",
    receipt: `order_${Date.now()}`,
    notes: { userId, planId, interval },
  });

  let customerId = user.razorpayCustomerId ?? undefined;
  if (!customerId) {
    try {
      const customer = await (rzp as any).customers.create({
        name: req.auth.sessionClaims?.name ?? "User",
        email: user.email ?? "",
        contact: "",
      });
      customerId = customer.id;
      await paymentStorage.updateUserRazorpay(userId, { razorpayCustomerId: customerId });
    } catch {
      // customer creation is optional
    }
  }

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: getRazorpayKeyId(),
    userName: req.auth.sessionClaims?.name ?? "User",
    userEmail: user.email ?? "",
    planId,
    interval,
  });
});

router.post("/billing/razorpay/verify", requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, interval } =
    req.body;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({ error: "Razorpay not configured" });
    return;
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  await paymentStorage.updateUserRazorpay(userId, {
    razorpaySubscriptionId: razorpay_payment_id,
    plan: planId,
    planInterval: interval,
  });
  await paymentStorage.setUserPlan(userId, planId, interval, "inr");

  res.json({ success: true });
});

router.post("/billing/cancel", requireAuth, async (req: any, res) => {
  const userId = req.auth.userId;
  const user = await paymentStorage.getUser(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.stripeSubscriptionId) {
    const stripe = await getUncachableStripeClient();
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    res.json({ success: true, message: "Subscription will cancel at period end" });
    return;
  }

  if (user.razorpaySubscriptionId) {
    const rzp = getRazorpayClient();
    await rzp.subscriptions.cancel(user.razorpaySubscriptionId, false);
    await paymentStorage.updateUserRazorpay(userId, {
      razorpaySubscriptionId: null,
      plan: "free",
      planInterval: "monthly",
    });
    res.json({ success: true, message: "Subscription cancelled" });
    return;
  }

  res.status(400).json({ error: "No active subscription" });
});

function getPriceInCents(planId: string, interval: string): number {
  const prices: Record<string, Record<string, number>> = {
    starter: { monthly: 900, yearly: 8600 },
    pro: { monthly: 1900, yearly: 18200 },
    team: { monthly: 4900, yearly: 47000 },
    enterprise: { monthly: 19900, yearly: 191000 },
  };
  return prices[planId]?.[interval] ?? 900;
}

function getPriceInPaise(planId: string, interval: string): number {
  const prices: Record<string, Record<string, number>> = {
    starter: { monthly: 19900, yearly: 191000 },
    pro: { monthly: 49900, yearly: 479000 },
    team: { monthly: 199900, yearly: 1919000 },
    enterprise: { monthly: 299900, yearly: 2879000 },
  };
  return prices[planId]?.[interval] ?? 49900;
}

export default router;
