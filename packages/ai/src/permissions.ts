import type { SubscriptionPlan } from "./plan-limits";

/** AI capability scopes — deny by default unless matrix allows. */
export type AiScope =
  | "ai.suggest.pricing"
  | "ai.suggest.seo"
  | "ai.rewrite.description"
  | "ai.generate.theme"
  | "ai.publish.store"
  | "ai.bulk.catalog"
  | "ai.refund.order";

export type ApprovalLevel = "automatic" | "human_review" | "admin_only";

/**
 * Required approval level per scope × plan.
 * Launch "Publish" is human_review fulfilled by the merchant clicking Publish.
 */
export const SCOPE_MATRIX: Record<AiScope, Record<SubscriptionPlan, ApprovalLevel>> = {
  "ai.rewrite.description": { free: "human_review", growth: "automatic", pro: "automatic" },
  "ai.generate.theme": { free: "human_review", growth: "human_review", pro: "human_review" },
  "ai.suggest.pricing": { free: "human_review", growth: "human_review", pro: "human_review" },
  "ai.suggest.seo": { free: "human_review", growth: "human_review", pro: "human_review" },
  "ai.publish.store": { free: "human_review", growth: "human_review", pro: "human_review" },
  "ai.bulk.catalog": { free: "admin_only", growth: "human_review", pro: "human_review" },
  "ai.refund.order": { free: "admin_only", growth: "admin_only", pro: "admin_only" },
};

export function resolveApprovalLevel(
  scope: AiScope,
  plan: string | null | undefined
): ApprovalLevel {
  const normalized: SubscriptionPlan =
    plan === "growth" || plan === "pro" ? plan : "free";
  return SCOPE_MATRIX[scope][normalized];
}

export function isAdminOnly(scope: AiScope, plan: string | null | undefined): boolean {
  return resolveApprovalLevel(scope, plan) === "admin_only";
}

export function canSellerApprove(level: ApprovalLevel): boolean {
  return level === "automatic" || level === "human_review";
}
