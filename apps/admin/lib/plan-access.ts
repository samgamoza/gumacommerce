import type { SubscriptionPlan } from "@guma-commerce/ai";

export type { SubscriptionPlan };

export const PLAN_DISPLAY: Record<SubscriptionPlan, string> = {
  free: "Free",
  growth: "Pro",
  pro: "Advance",
};

export const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  free: 0,
  growth: 1,
  pro: 2,
};

export function normalizeAdminPlan(plan: string | null | undefined): SubscriptionPlan {
  if (plan === "growth" || plan === "pro") return plan;
  return "free";
}

export function planAtLeast(current: SubscriptionPlan, required: SubscriptionPlan): boolean {
  return PLAN_ORDER[current] >= PLAN_ORDER[required];
}

export function upgradeHref(
  highlight: Exclude<SubscriptionPlan, "free">,
  ref?: string
): string {
  const params = new URLSearchParams({ highlight });
  if (ref) params.set("ref", ref);
  return `/settings/subscription?${params.toString()}`;
}

export function planBadgeLabel(required: SubscriptionPlan): string {
  if (required === "pro") return "Advance+";
  if (required === "growth") return "Pro+";
  return "Free";
}
