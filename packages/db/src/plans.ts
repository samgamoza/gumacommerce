/**
 * Single source of truth for seller subscription plans.
 *
 * Constitution mapping:
 *   free    → Free     (GUMA Launch)
 *   growth  → Pro      (GUMA Workspace)
 *   advance → Advance  (DB id remains `pro` for compatibility)
 *
 * Do not define alternate price tables elsewhere — import from here.
 * Client components cannot import this module (pulls Postgres via db barrel).
 * Mirror the id/name/price subset in apps/platform/lib/plans.ts.
 */

export type SubscriptionPlanId = "free" | "growth" | "pro";

export interface PlanDefinition {
  id: SubscriptionPlanId;
  /** Seller-facing marketing name */
  name: string;
  /** Constitutional label */
  constitutionLabel: "Free" | "Pro" | "Advance";
  priceMonthly: number;
  tagline: string;
  features: string[];
  /** Workspace AI features unlocked */
  workspaceEnabled: boolean;
}

export const SELLER_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    constitutionLabel: "Free",
    priceMonthly: 0,
    tagline: "Launch your store in minutes",
    features: [
      "GUMA Launch wizard",
      "Curated templates",
      "GCash, Maya & COD checkout",
      "Up to 20 products",
    ],
    workspaceEnabled: false,
  },
  {
    id: "growth",
    name: "Pro",
    constitutionLabel: "Pro",
    priceMonthly: 499,
    tagline: "AI Workspace for growing shops",
    features: [
      "Everything in Free",
      "GUMA Workspace",
      "AI content & campaigns",
      "Posting agents",
      "Unlimited products",
    ],
    workspaceEnabled: true,
  },
  {
    id: "pro",
    name: "Advance",
    constitutionLabel: "Advance",
    priceMonthly: 999,
    tagline: "Full AI commerce operating system",
    features: [
      "Everything in Pro",
      "Advanced templates",
      "Priority support",
      "Smart pricing & live selling (roadmap)",
    ],
    workspaceEnabled: true,
  },
];

export const PLAN_PRICES_PHP: Record<"growth" | "pro", number> = {
  growth: 499,
  pro: 999,
};

export const PLAN_PERIOD_DAYS = 30;

/** Legacy platform id `starter` maps to growth (Pro). */
export function normalizePlanId(id: string | null | undefined): SubscriptionPlanId {
  if (id === "pro" || id === "advance") return "pro";
  if (id === "growth" || id === "starter") return "growth";
  return "free";
}

export function getSellerPlan(id: string | null | undefined): PlanDefinition {
  const normalized = normalizePlanId(id);
  return SELLER_PLANS.find((p) => p.id === normalized) ?? SELLER_PLANS[0]!;
}

export function planPriceMonthly(id: string | null | undefined): number {
  return getSellerPlan(id).priceMonthly;
}

/** @deprecated Use SELLER_PLANS — alias kept for platform MRR code during migration */
export const PLATFORM_PLANS = SELLER_PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  priceMonthly: p.priceMonthly,
  tagline: p.tagline,
  features: p.features,
}));
