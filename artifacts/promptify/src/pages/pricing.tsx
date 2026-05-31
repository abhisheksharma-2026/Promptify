import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, Globe, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { usePricing, useStripeCheckout, useRazorpayCheckout } from "@/hooks/use-billing";
import { USD_PLANS, INR_PLANS, formatPrice, getYearlySaving } from "@/lib/pricing";
import type { PricingPlan, Currency, Interval } from "@/lib/pricing";
import { Link, useLocation } from "wouter";

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [interval, setInterval] = useState<Interval>("monthly");
  const [currencyOverride, setCurrencyOverride] = useState<Currency | null>(null);

  const { data: pricingData } = usePricing(currencyOverride ?? undefined);
  const detectedCurrency: Currency = pricingData?.currency ?? "usd";
  const currency: Currency = currencyOverride ?? detectedCurrency;
  const isIndia = currency === "inr";

  const plans: PricingPlan[] = isIndia ? INR_PLANS : USD_PLANS;

  const stripeCheckout = useStripeCheckout();
  const razorpayCheckout = useRazorpayCheckout();

  const handleUpgrade = async (plan: PricingPlan) => {
    if (plan.id === "free") return;

    if (!isSignedIn) {
      setLocation("/sign-up");
      return;
    }

    if (isIndia) {
      await razorpayCheckout.mutateAsync({ planId: plan.id, interval });
    } else {
      await stripeCheckout.mutateAsync({ planId: plan.id, interval });
    }
  };

  const isPending = stripeCheckout.isPending || razorpayCheckout.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] opacity-15">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-transparent blur-[120px] rounded-full" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
            Choose your plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free. Upgrade when you need more power.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {/* Billing interval toggle */}
          <div className="flex items-center bg-card border border-border rounded-full p-1">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                interval === "monthly"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                interval === "yearly"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>

          {/* Currency toggle */}
          <div className="flex items-center bg-card border border-border rounded-full p-1 gap-1">
            <button
              onClick={() => setCurrencyOverride("usd")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currency === "usd"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              USD
            </button>
            <button
              onClick={() => setCurrencyOverride("inr")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currency === "inr"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              INR
            </button>
          </div>
        </div>

        {/* Payment method banner */}
        {isIndia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-8 text-sm text-muted-foreground"
          >
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
              🇮🇳 India pricing — Pay with UPI, Cards, Net Banking & Wallets via Razorpay
            </span>
          </motion.div>
        )}
        {!isIndia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              🌍 International pricing — Pay with Card, Apple Pay & Google Pay via Stripe
            </span>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-primary/60 bg-gradient-to-b from-primary/10 to-primary/5 shadow-[0_0_40px_rgba(124,58,237,0.15)]"
                  : "border-border bg-card/50"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(
                      interval === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice,
                      plan.currency
                    )}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-muted-foreground text-sm">/mo</span>
                  )}
                </div>
                {interval === "yearly" && plan.yearlyPrice > 0 && (
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(plan.monthlyPrice, plan.currency)}/mo
                    </span>
                    <span className="text-xs text-green-400 ml-1.5">
                      Save {getYearlySaving(plan)}%
                    </span>
                  </div>
                )}
                {interval === "yearly" && plan.yearlyPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Billed {formatPrice(plan.yearlyPrice, plan.currency)}/year
                  </p>
                )}
              </div>

              <Button
                onClick={() => handleUpgrade(plan)}
                disabled={plan.id === "free" || isPending}
                variant={plan.highlighted ? "default" : "outline"}
                className={`w-full mb-6 ${
                  plan.highlighted
                    ? "bg-primary hover:bg-primary/90"
                    : "border-border hover:bg-accent"
                }`}
                size="sm"
              >
                {plan.id === "free"
                  ? "Get Started Free"
                  : isPending
                  ? "Processing…"
                  : `Get ${plan.name}`}
              </Button>

              <div className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature.text} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        feature.included ? "text-foreground" : "text-muted-foreground/50"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ / Trust section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-muted-foreground mb-2">
            All plans include a 7-day free trial. Cancel anytime. No hidden fees.
          </p>
          {isIndia && (
            <p className="text-xs text-muted-foreground">
              GST applicable as per Indian tax regulations.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <span>🔒 Secure payments</span>
            <span>🔄 Cancel anytime</span>
            <span>📧 24/7 email support</span>
            {isIndia && <span>🇮🇳 GST invoices</span>}
            {!isIndia && <span>🌍 Global coverage</span>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
