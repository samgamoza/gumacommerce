/**
 * @deprecated Import from `@gumakart/plans` directly.
 * Re-export kept so existing `@gumakart/db` consumers keep working.
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
} from "@gumakart/plans";
