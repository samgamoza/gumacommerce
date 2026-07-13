import { normalizePlanId, type SubscriptionPlanId } from "./catalog";

export type AiTaskType = "agent_post" | "agent_campaign" | "chat" | "generation";

export type LlmModelId =
  | "mock"
  | "gemini-2.0-flash"
  | "gpt-4o-mini"
  | "gpt-4o"
  | "llama-3.3-70b-groq";

export interface PlanAiLimits {
  /** Display label — always constitution plan name */
  label: string;
  agentRunsPerWeek: number;
  agentRunsPerDay: number | null;
  chatMessagesPerDay: number;
  generationsPerMonth: number;
  smsReminders: boolean;
  models: Record<AiTaskType, LlmModelId>;
  /**
   * Soft monthly token budget. Once a tenant crosses it, tasks silently fall
   * back to the cheapest configured model instead of blocking.
   */
  softTokenBudgetPerMonth: number;
}

/** Output-token ceilings per task — the single biggest LLM cost lever. */
export const MAX_TOKENS_BY_TASK: Record<AiTaskType, number> = {
  chat: 400,
  generation: 900,
  agent_post: 900,
  agent_campaign: 1600,
};

/** Cheapest live model: Gemini Flash (free tier), then Groq, then 4o-mini. */
export const THRIFTY_MODEL: LlmModelId = "gemini-2.0-flash";

/**
 * AI quotas & model matrix — owned by the plan catalog (ADR D4).
 * Labels use constitution names (Free / Pro / Advance).
 */
export const PLAN_AI_LIMITS: Record<SubscriptionPlanId, PlanAiLimits> = {
  free: {
    label: "Free",
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
    softTokenBudgetPerMonth: 200_000,
  },
  growth: {
    label: "Pro",
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
    softTokenBudgetPerMonth: 2_000_000,
  },
  pro: {
    label: "Advance",
    agentRunsPerWeek: 999,
    agentRunsPerDay: 10,
    chatMessagesPerDay: 2000,
    generationsPerMonth: 500,
    smsReminders: true,
    models: {
      agent_post: "gpt-4o-mini",
      agent_campaign: "gpt-4o",
      chat: "gpt-4o-mini",
      generation: "gpt-4o-mini",
    },
    softTokenBudgetPerMonth: 8_000_000,
  },
};

export function resolveModelForTask(
  plan: string | null | undefined,
  task: AiTaskType
): LlmModelId {
  const limits = PLAN_AI_LIMITS[normalizePlanId(plan)];
  return limits.models[task];
}

/**
 * Plan model, downgraded to the thrifty model when the tenant has burned
 * through their soft monthly token budget.
 */
export function resolveBudgetAwareModel(
  plan: string | null | undefined,
  task: AiTaskType,
  tokensUsedThisMonth?: number
): LlmModelId {
  const limits = PLAN_AI_LIMITS[normalizePlanId(plan)];
  const requested = limits.models[task];
  if (
    typeof tokensUsedThisMonth === "number" &&
    tokensUsedThisMonth >= limits.softTokenBudgetPerMonth
  ) {
    return THRIFTY_MODEL;
  }
  return requested;
}

export interface AiUsageSnapshot {
  plan: SubscriptionPlanId;
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
