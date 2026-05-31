import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Crown, Calendar, Download, ExternalLink,
  AlertCircle, CheckCircle2, Loader2, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useBillingInfo,
  useStripePortal,
  useCancelSubscription,
} from "@/hooks/use-billing";
import { formatPrice } from "@/lib/pricing";
import type { Currency } from "@/lib/pricing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  starter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pro: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  team: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  enterprise: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function BillingPage() {
  const { data, isLoading } = useBillingInfo();
  const stripePortal = useStripePortal();
  const cancelSub = useCancelSubscription();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const plan = data?.plan ?? "free";
  const planInterval = data?.planInterval ?? "monthly";
  const currency = (data?.currency ?? "usd") as Currency;
  const subscription = data?.subscription ?? null;
  const invoices: any[] = data?.invoices ?? [];
  const isIndia = currency === "inr";

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const colorClass = PLAN_COLORS[plan] ?? PLAN_COLORS.free;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
              <p className="text-sm text-muted-foreground">Manage your plan and payment history</p>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="rounded-2xl border border-border bg-card/50 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">{planLabel}</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}
                  >
                    {planInterval === "yearly" ? "Annual" : "Monthly"}
                  </span>
                  {isIndia && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      🇮🇳 INR
                    </span>
                  )}
                </div>
                {subscription && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {subscription.cancelAtPeriodEnd ? (
                      <span className="text-amber-400">
                        Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>
                        Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/pricing">
                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                    {plan === "free" ? "Upgrade" : "Change plan"}
                  </Link>
                </Button>

                {subscription && !subscription.cancelAtPeriodEnd && (
                  <>
                    {!isIndia && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stripePortal.mutate()}
                        disabled={stripePortal.isPending}
                      >
                        {stripePortal.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-1.5" />
                        )}
                        Manage
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancel plan
                    </Button>
                  </>
                )}
              </div>
            </div>

            {subscription && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  {subscription.status === "active" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-sm capitalize">
                    Status:{" "}
                    <span
                      className={
                        subscription.status === "active" ? "text-green-400" : "text-amber-400"
                      }
                    >
                      {subscription.status}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    via {subscription.gateway === "razorpay" ? "Razorpay" : "Stripe"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Gateway Info */}
          <div className="rounded-xl border border-border bg-card/30 p-4 mb-6 flex items-center gap-3">
            <div className="text-2xl">{isIndia ? "🇮🇳" : "🌍"}</div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isIndia ? "Razorpay payments" : "Stripe payments"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isIndia
                  ? "UPI, Cards, Net Banking, Wallets supported. GST invoices included."
                  : "Card, Apple Pay, Google Pay supported. International payments."}
              </p>
            </div>
          </div>

          {/* Billing History */}
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Billing History</h2>

            {invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No billing history yet</p>
                <p className="text-xs mt-1">Your invoices will appear here after your first payment</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatPrice(inv.amount, currency)} {inv.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          inv.status === "paid"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {inv.status}
                      </span>
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      {inv.hostedUrl && (
                        <a
                          href={inv.hostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription>
              Your plan will remain active until the end of the current billing period. After that,
              you'll be moved to the Free plan and lose access to premium features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep plan
            </Button>
            <Button
              variant="destructive"
              disabled={cancelSub.isPending}
              onClick={async () => {
                await cancelSub.mutateAsync();
                setShowCancelDialog(false);
              }}
            >
              {cancelSub.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
