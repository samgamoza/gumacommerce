/**
 * @deprecated Prefer `@guma-commerce/plans` for catalog + limits.
 * Re-exports kept for existing `@guma-commerce/ai` import sites.
 */
export {
  MAX_TOKENS_BY_TASK,
  PLAN_AI_LIMITS,
  THRIFTY_MODEL,
  checkQuota,
  normalizePlan,
  resolveBudgetAwareModel,
  resolveModelForTask,
  type AiTaskType,
  type AiUsageSnapshot,
  type LlmModelId,
  type PlanAiLimits,
  type QuotaCheckResult,
  type SubscriptionPlan,
} from "@guma-commerce/plans";
