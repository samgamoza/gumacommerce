import {
  normalizePlanId,
  planAtLeast as catalogPlanAtLeast,
  planDisplayName,
  type SubscriptionPlanId,
} from "@guma-commerce/plans";

export type StorePlan = SubscriptionPlanId;
export { planDisplayName };

export function normalizeStorePlan(plan?: string | null): StorePlan {
  return normalizePlanId(plan);
}

export function planAtLeast(current: StorePlan, required: StorePlan): boolean {
  return catalogPlanAtLeast(current, required);
}

export function hasGrowthFeatures(plan?: string | null): boolean {
  return planAtLeast(normalizeStorePlan(plan), "growth");
}

export function hasProFeatures(plan?: string | null): boolean {
  return planAtLeast(normalizeStorePlan(plan), "pro");
}

export function upgradeUrl(tier: "growth" | "pro", ref = "storefront"): string {
  const admin = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";
  return `${admin}/settings/subscription?highlight=${tier}&ref=${ref}`;
}
