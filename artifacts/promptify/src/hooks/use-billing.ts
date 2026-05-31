import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function usePricing(currency?: string) {
  return useQuery({
    queryKey: ["pricing", currency],
    queryFn: () => apiFetch(`/api/pricing${currency ? `?currency=${currency}` : ""}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBillingInfo() {
  return useQuery({
    queryKey: ["billing-me"],
    queryFn: () => apiFetch("/api/billing/me"),
    staleTime: 30 * 1000,
  });
}

export function useStripeCheckout() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ planId, interval }: { planId: string; interval: string }) => {
      const data = await apiFetch("/api/billing/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ planId, interval }),
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useStripePortal() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const data = await apiFetch("/api/billing/stripe/portal", { method: "POST" });
      return data;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast({ title: "Portal error", description: err.message, variant: "destructive" });
    },
  });
}

export function useRazorpayCheckout() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, interval }: { planId: string; interval: string }) => {
      const order = await apiFetch("/api/billing/razorpay/create-order", {
        method: "POST",
        body: JSON.stringify({ planId, interval }),
      });
      return new Promise<void>((resolve, reject) => {
        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) {
          reject(new Error("Razorpay SDK not loaded"));
          return;
        }
        const rzp = new Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: "Promptify",
          description: `${order.planId.charAt(0).toUpperCase() + order.planId.slice(1)} Plan – ${order.interval}`,
          prefill: { name: order.userName, email: order.userEmail },
          theme: { color: "#7c3aed" },
          handler: async (response: any) => {
            try {
              await apiFetch("/api/billing/razorpay/verify", {
                method: "POST",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: order.planId,
                  interval: order.interval,
                }),
              });
              queryClient.invalidateQueries({ queryKey: ["billing-me"] });
              resolve();
            } catch (e: any) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rzp.open();
      });
    },
    onSuccess: () => {
      toast({ title: "Payment successful!", description: "Your plan has been upgraded." });
      queryClient.invalidateQueries({ queryKey: ["billing-me"] });
    },
    onError: (err: Error) => {
      if (err.message !== "Payment cancelled") {
        toast({ title: "Payment failed", description: err.message, variant: "destructive" });
      }
    },
  });
}

export function useCancelSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => apiFetch("/api/billing/cancel", { method: "POST" }),
    onSuccess: (data) => {
      toast({ title: "Subscription cancelled", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["billing-me"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cancellation failed", description: err.message, variant: "destructive" });
    },
  });
}
