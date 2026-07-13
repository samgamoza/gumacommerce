/**
 * @deprecated Import from `@guma-commerce/plans` directly.
 * Re-export kept so existing `@guma-commerce/db` consumers keep working.
 */
export {
  SELLER_PLANS,
  PLATFORM_PLANS,
  PLAN_PRICES_PHP,
  PLAN_PERIOD_DAYS,
  normalizePlanId,
  getSellerPlan,
  planPriceMonthly,
  type PlanDefinition,
  type SubscriptionPlanId,
} from "@guma-commerce/plans";
