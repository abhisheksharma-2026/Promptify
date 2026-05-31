import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Stripe webhook MUST come before express.json() — needs raw Buffer body
app.post(
  "/api/billing/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const { default: paymentsRouter } = await import("./routes/payments");
    // Delegate to payments router's inline webhook handler by re-dispatching
    // Actually we inline the handler here to avoid double-routing
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }

    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const { paymentStorage } = await import("./paymentStorage");

      let event: any;
      const stripe = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
      } else {
        event = JSON.parse((req.body as Buffer).toString());
      }

      if (
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.created"
      ) {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        const planId = sub.metadata?.planId ?? "pro";
        const interval = sub.metadata?.interval ?? "monthly";
        if (userId) {
          await paymentStorage.updateUserStripe(userId, {
            stripeSubscriptionId: sub.id,
            plan: planId,
            planInterval: interval,
          });
          await paymentStorage.setUserPlan(userId, planId, interval, "usd");
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await paymentStorage.updateUserStripe(userId, {
            stripeSubscriptionId: null,
            plan: "free",
            planInterval: "monthly",
          });
          await paymentStorage.setUserPlan(userId, "free", "monthly", "usd");
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook error" });
    }
  }
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

export default app;
