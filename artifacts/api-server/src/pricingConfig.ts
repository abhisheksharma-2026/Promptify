export type PlanId = "free" | "starter" | "pro" | "team" | "enterprise";
export type Currency = "usd" | "inr";
export type Interval = "monthly" | "yearly";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: Currency;
  features: PlanFeature[];
  promptsPerMonth: number;
  highlighted?: boolean;
  badge?: string;
}

export const USD_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For individuals just getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "usd",
    promptsPerMonth: 10,
    features: [
      { text: "10 AI prompts/month", included: true },
      { text: "Basic templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: false },
      { text: "Export (PDF/TXT/MD)", included: false },
      { text: "Priority support", included: false },
      { text: "Team workspace", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For creators and freelancers",
    monthlyPrice: 9,
    yearlyPrice: 86,
    currency: "usd",
    promptsPerMonth: 100,
    features: [
      { text: "100 AI prompts/month", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Email support", included: true },
      { text: "Team workspace", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For power users and professionals",
    monthlyPrice: 19,
    yearlyPrice: 182,
    currency: "usd",
    promptsPerMonth: 500,
    highlighted: true,
    badge: "Most Popular",
    features: [
      { text: "500 AI prompts/month", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Priority support", included: true },
      { text: "Team workspace", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "For teams and growing businesses",
    monthlyPrice: 49,
    yearlyPrice: 470,
    currency: "usd",
    promptsPerMonth: 2000,
    features: [
      { text: "2000 AI prompts/month", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Priority support", included: true },
      { text: "Team workspace (5 seats)", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: 199,
    yearlyPrice: 1910,
    currency: "usd",
    promptsPerMonth: -1,
    features: [
      { text: "Unlimited AI prompts", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Dedicated support", included: true },
      { text: "Team workspace (unlimited)", included: true },
      { text: "API access", included: true },
    ],
  },
];

export const INR_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For individuals just getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "inr",
    promptsPerMonth: 10,
    features: [
      { text: "10 AI prompts/month", included: true },
      { text: "Basic templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: false },
      { text: "Export (PDF/TXT/MD)", included: false },
      { text: "Priority support", included: false },
      { text: "Team workspace", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For creators and freelancers",
    monthlyPrice: 199,
    yearlyPrice: 1910,
    currency: "inr",
    promptsPerMonth: 100,
    features: [
      { text: "100 AI prompts/month", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Email support", included: true },
      { text: "Team workspace", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For power users and professionals",
    monthlyPrice: 499,
    yearlyPrice: 4790,
    currency: "inr",
    promptsPerMonth: 500,
    highlighted: true,
    badge: "Most Popular",
    features: [
      { text: "500 AI prompts/month", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Priority support", included: true },
      { text: "Team workspace", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "For teams and growing businesses",
    monthlyPrice: 1999,
    yearlyPrice: 19190,
    currency: "inr",
    promptsPerMonth: 2000,
    features: [
      { text: "2000 AI prompts/month", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Priority support", included: true },
      { text: "Team workspace (5 seats)", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: 2999,
    yearlyPrice: 28790,
    currency: "inr",
    promptsPerMonth: -1,
    features: [
      { text: "Unlimited AI prompts", included: true },
      { text: "All templates", included: true },
      { text: "Prompt library", included: true },
      { text: "Favorites", included: true },
      { text: "Version history", included: true },
      { text: "Export (PDF/TXT/MD)", included: true },
      { text: "Dedicated support", included: true },
      { text: "Team workspace (unlimited)", included: true },
      { text: "API access", included: true },
    ],
  },
];

export function getPlansForCurrency(currency: Currency): PricingPlan[] {
  return currency === "inr" ? INR_PLANS : USD_PLANS;
}

export function getPlanLimits(plan: PlanId): number {
  const limits: Record<PlanId, number> = {
    free: 10,
    starter: 100,
    pro: 500,
    team: 2000,
    enterprise: -1,
  };
  return limits[plan] ?? 10;
}

export function getCurrencySymbol(currency: Currency): string {
  return currency === "inr" ? "₹" : "$";
}

export function planAllows(plan: PlanId, feature: string): boolean {
  const planOrder: PlanId[] = ["free", "starter", "pro", "team", "enterprise"];
  const planIndex = planOrder.indexOf(plan);

  const featureMinPlan: Record<string, number> = {
    version_history: 1,
    export: 1,
    priority_support: 2,
    team_workspace: 3,
    api_access: 4,
  };

  const minIndex = featureMinPlan[feature] ?? 0;
  return planIndex >= minIndex;
}
