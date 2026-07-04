export type SubscriptionPlan = "free" | "growth" | "pro";

export type AiTaskType = "agent_post" | "agent_campaign" | "chat" | "generation";

export type LlmModelId =
  | "mock"
  | "gemini-2.0-flash"
  | "gpt-4o-mini"
  | "gpt-4o"
  | "llama-3.3-70b-groq";

export interface PlanAiLimits {
  label: string;
  agentRunsPerWeek: number;
  agentRunsPerDay: number | null;
  chatMessagesPerDay: number;
  generationsPerMonth: number;
  smsReminders: boolean;
  models: Record<AiTaskType, LlmModelId>;
}

export const PLAN_AI_LIMITS: Record<SubscriptionPlan, PlanAiLimits> = {
  free: {
    label: "Sulit (Free)",
    agentRunsPerWeek: 3,
    agentRunsPerDay: null,
    chatMessagesPerDay: 25,
    generationsPerMonth: 5,
    smsReminders: false,
    models: {
      agent_post: "gemini-2.0-flash",
      agent_campaign: "gemini-2.0-flash",
      chat: "gemini-2.0-flash",
      generation: "gemini-2.0-flash",
    },
  },
  growth: {
    label: "Growth",
    agentRunsPerWeek: 14,
    agentRunsPerDay: 2,
    chatMessagesPerDay: 200,
    generationsPerMonth: 100,
    smsReminders: true,
    models: {
      agent_post: "gpt-4o-mini",
      agent_campaign: "gpt-4o-mini",
      chat: "gpt-4o-mini",
      generation: "gpt-4o-mini",
    },
  },
  pro: {
    label: "Pro",
    agentRunsPerWeek: 999,
    agentRunsPerDay: 10,
    chatMessagesPerDay: 2000,
    generationsPerMonth: 500,
    smsReminders: true,
    models: {
      agent_post: "gpt-4o-mini",
      agent_campaign: "gpt-4o",
      chat: "gpt-4o-mini",
      generation: "gpt-4o",
    },
  },
};

export function normalizePlan(plan: string | null | undefined): SubscriptionPlan {
  if (plan === "growth" || plan === "pro") return plan;
  return "free";
}

export function resolveModelForTask(
  plan: string | null | undefined,
  task: AiTaskType
): LlmModelId {
  const limits = PLAN_AI_LIMITS[normalizePlan(plan)];
  return limits.models[task];
}

export interface AiUsageSnapshot {
  plan: SubscriptionPlan;
  limits: PlanAiLimits;
  agentRunsThisWeek: number;
  agentRunsToday: number;
  chatMessagesToday: number;
  generationsThisMonth: number;
  tokensThisMonth: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  usage: AiUsageSnapshot;
}

export function checkQuota(usage: AiUsageSnapshot, task: AiTaskType): QuotaCheckResult {
  const { limits } = usage;

  if (task === "chat") {
    if (usage.chatMessagesToday >= limits.chatMessagesPerDay) {
      return {
        allowed: false,
        reason: `Daily chat limit reached (${limits.chatMessagesPerDay}). Upgrade for more.`,
        usage,
      };
    }
    return { allowed: true, usage };
  }

  if (task === "generation") {
    if (usage.generationsThisMonth >= limits.generationsPerMonth) {
      return {
        allowed: false,
        reason: `Monthly AI generation limit reached (${limits.generationsPerMonth}). Upgrade for more.`,
        usage,
      };
    }
    return { allowed: true, usage };
  }

  if (usage.agentRunsThisWeek >= limits.agentRunsPerWeek) {
    return {
      allowed: false,
      reason: `Weekly agent limit reached (${limits.agentRunsPerWeek}). Upgrade for daily automation.`,
      usage,
    };
  }

  if (limits.agentRunsPerDay !== null && usage.agentRunsToday >= limits.agentRunsPerDay) {
    return {
      allowed: false,
      reason: `Daily agent limit reached (${limits.agentRunsPerDay}). Try again tomorrow or upgrade.`,
      usage,
    };
  }

  return { allowed: true, usage };
}
