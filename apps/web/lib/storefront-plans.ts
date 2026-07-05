export type StorePlan = "free" | "growth" | "pro";

export function normalizeStorePlan(plan?: string | null): StorePlan {
  if (plan === "growth" || plan === "pro") return plan;
  return "free";
}

export function planRank(plan: StorePlan): number {
  if (plan === "pro") return 2;
  if (plan === "growth") return 1;
  return 0;
}

export function planAtLeast(current: StorePlan, required: StorePlan): boolean {
  return planRank(current) >= planRank(required);
}

export function hasGrowthFeatures(plan?: string | null): boolean {
  return planAtLeast(normalizeStorePlan(plan), "growth");
}

export function hasProFeatures(plan?: string | null): boolean {
  return planAtLeast(normalizeStorePlan(plan), "pro");
}

export function upgradeUrl(
  tier: "growth" | "pro",
  ref = "storefront"
): string {
  const admin =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";
  return `${admin}/settings/subscription?highlight=${tier}&ref=${ref}`;
}
