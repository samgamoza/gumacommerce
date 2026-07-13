import {
  planAtLeast as catalogPlanAtLeast,
  planBadgeLabel as catalogPlanBadgeLabel,
  planDisplayName,
  normalizePlanId,
  upgradeHref as catalogUpgradeHref,
  type SubscriptionPlanId,
} from "@guma-commerce/plans";

export type SubscriptionPlan = SubscriptionPlanId;

/** Constitution display names from the canonical catalog */
export const PLAN_DISPLAY: Record<SubscriptionPlan, string> = {
  free: planDisplayName("free"),
  growth: planDisplayName("growth"),
  pro: planDisplayName("pro"),
};

export function normalizeAdminPlan(plan: string | null | undefined): SubscriptionPlan {
  return normalizePlanId(plan);
}

export function planAtLeast(current: SubscriptionPlan, required: SubscriptionPlan): boolean {
  return catalogPlanAtLeast(current, required);
}

export function upgradeHref(
  highlight: Exclude<SubscriptionPlan, "free">,
  ref?: string
): string {
  return catalogUpgradeHref(highlight, ref);
}

export function planBadgeLabel(required: SubscriptionPlan): string {
  return catalogPlanBadgeLabel(required);
}
