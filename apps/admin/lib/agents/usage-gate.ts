import { getRawAiUsageCounts } from "@gumakart/db";
import {
  checkQuota,
  normalizePlan,
  PLAN_AI_LIMITS,
  type AiTaskType,
  type AiUsageSnapshot,
  type QuotaCheckResult,
} from "@gumakart/ai";

export async function getUsageSnapshot(tenantId: string): Promise<AiUsageSnapshot> {
  const raw = await getRawAiUsageCounts(tenantId);
  const plan = normalizePlan(raw.subscriptionPlan);

  return {
    plan,
    limits: PLAN_AI_LIMITS[plan],
    agentRunsThisWeek: raw.agentRunsThisWeek,
    agentRunsToday: raw.agentRunsToday,
    chatMessagesToday: raw.chatMessagesToday,
    generationsThisMonth: raw.generationsThisMonth,
    tokensThisMonth: raw.tokensThisMonth,
  };
}

export async function assertAiQuota(
  tenantId: string,
  task: AiTaskType
): Promise<QuotaCheckResult> {
  const usage = await getUsageSnapshot(tenantId);
  return checkQuota(usage, task);
}
