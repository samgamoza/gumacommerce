import { normalizePlanId, planAtLeast, type SubscriptionPlanId } from "./catalog";

/**
 * Post-publish storefront template switching.
 *
 * Soft-launch / local: free for every seller (iterate looks while testing).
 * Production (hard launch): Growth+ (Pro constitution) — first publish stays free.
 *
 * Soft-launch flag: `GUMA_SOFT_LAUNCH=true` on the runtime host.
 * Override: `GUMA_FREE_TEMPLATE_SWITCH=true` forces free even in production.
 * Hard gate early: `GUMA_TEMPLATE_SWITCH_REQUIRES_UPGRADE=true` forces Growth+ always.
 *
 * Ops Settings can force true/false via platform_settings; pass those as `overrides`.
 * Client-safe when called without DB (env + plan only).
 */

export const TEMPLATE_SWITCH_REQUIRED_PLAN: Exclude<SubscriptionPlanId, "free"> = "growth";

/** null / undefined = inherit env. */
export type SoftLaunchOverrides = {
  softLaunch?: boolean | null;
  freeTemplateSwitch?: boolean | null;
  requiresUpgrade?: boolean | null;
};

function isProductionLikeRuntime(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV) return true;
  return false;
}

function resolveFlag(override: boolean | null | undefined, envTrue: boolean): boolean {
  if (override === true) return true;
  if (override === false) return false;
  return envTrue;
}

export function isSoftLaunchRuntime(overrides?: SoftLaunchOverrides): boolean {
  return resolveFlag(overrides?.softLaunch, process.env.GUMA_SOFT_LAUNCH === "true");
}

export function allowFreePostPublishTemplateSwitch(overrides?: SoftLaunchOverrides): boolean {
  if (
    resolveFlag(
      overrides?.requiresUpgrade,
      process.env.GUMA_TEMPLATE_SWITCH_REQUIRES_UPGRADE === "true"
    )
  ) {
    return false;
  }
  if (
    resolveFlag(
      overrides?.freeTemplateSwitch,
      process.env.GUMA_FREE_TEMPLATE_SWITCH === "true"
    )
  ) {
    return true;
  }
  if (isSoftLaunchRuntime(overrides)) return true;
  return !isProductionLikeRuntime();
}

export interface TemplateSwitchEntitlement {
  /** Whether this seller may change template after first publish. */
  allowed: boolean;
  /** Plan required when free switching is off. */
  requiredPlan: Exclude<SubscriptionPlanId, "free">;
  /** True when soft-launch / local free switching is active. */
  freeDuringSoftLaunch: boolean;
  /** Short seller-facing reason when blocked. */
  reason: string | null;
}

export function canChangeStorefrontTemplateAfterPublish(
  subscriptionPlan: string | null | undefined,
  overrides?: SoftLaunchOverrides
): TemplateSwitchEntitlement {
  const requiredPlan = TEMPLATE_SWITCH_REQUIRED_PLAN;
  if (allowFreePostPublishTemplateSwitch(overrides)) {
    return {
      allowed: true,
      requiredPlan,
      freeDuringSoftLaunch: true,
      reason: null,
    };
  }

  const plan = normalizePlanId(subscriptionPlan);
  const allowed = planAtLeast(plan, requiredPlan);
  return {
    allowed,
    requiredPlan,
    freeDuringSoftLaunch: false,
    reason: allowed
      ? null
      : "Changing your storefront template after publish is included on Pro and Advance.",
  };
}
