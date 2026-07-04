import { and, count, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../client";
import {
  agentRuns,
  aiGenerations,
  aiUsageMonthly,
  shopChatMessages,
  tenants,
  users,
} from "../schema/index";

export interface RawAiUsageCounts {
  subscriptionPlan: string | null;
  agentRunsThisWeek: number;
  agentRunsToday: number;
  chatMessagesToday: number;
  generationsThisMonth: number;
  tokensThisMonth: number;
}

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function startOfDayManila(): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return new Date(`${y}-${m}-${d}T00:00:00+08:00`);
}

function weekAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

export async function getRawAiUsageCounts(tenantId: string): Promise<RawAiUsageCounts> {
  const db = getDb();
  const periodMonth = currentPeriodMonth();
  const dayStart = startOfDayManila();
  const weekStart = weekAgo();

  const [tenant] = await db
    .select({ subscriptionPlan: tenants.subscriptionPlan })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const [[weekRuns], [dayRuns], [chatToday], [monthUsage], [genCount]] = await Promise.all([
    db
      .select({ total: count() })
      .from(agentRuns)
      .where(and(eq(agentRuns.tenantId, tenantId), gte(agentRuns.startedAt, weekStart))),
    db
      .select({ total: count() })
      .from(agentRuns)
      .where(and(eq(agentRuns.tenantId, tenantId), gte(agentRuns.startedAt, dayStart))),
    db
      .select({ total: count() })
      .from(shopChatMessages)
      .where(
        and(
          eq(shopChatMessages.tenantId, tenantId),
          eq(shopChatMessages.role, "user"),
          gte(shopChatMessages.createdAt, dayStart)
        )
      ),
    db
      .select()
      .from(aiUsageMonthly)
      .where(and(eq(aiUsageMonthly.tenantId, tenantId), eq(aiUsageMonthly.periodMonth, periodMonth)))
      .limit(1),
    db
      .select({ total: count() })
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.tenantId, tenantId),
          gte(aiGenerations.createdAt, new Date(`${periodMonth}-01T00:00:00Z`))
        )
      ),
  ]);

  return {
    subscriptionPlan: tenant?.subscriptionPlan ?? "free",
    agentRunsThisWeek: weekRuns?.total ?? 0,
    agentRunsToday: dayRuns?.total ?? 0,
    chatMessagesToday: chatToday?.total ?? 0,
    generationsThisMonth: monthUsage?.generations ?? genCount?.total ?? 0,
    tokensThisMonth: monthUsage?.tokensUsed ?? 0,
  };
}

export async function recordAiUsage(
  tenantId: string,
  input: { incrementGenerations?: boolean; tokensUsed?: number }
): Promise<void> {
  const db = getDb();
  const periodMonth = currentPeriodMonth();

  const [existing] = await db
    .select()
    .from(aiUsageMonthly)
    .where(and(eq(aiUsageMonthly.tenantId, tenantId), eq(aiUsageMonthly.periodMonth, periodMonth)))
    .limit(1);

  if (existing) {
    await db
      .update(aiUsageMonthly)
      .set({
        generations: existing.generations + (input.incrementGenerations ? 1 : 0),
        tokensUsed: existing.tokensUsed + (input.tokensUsed ?? 0),
        updatedAt: new Date(),
      })
      .where(eq(aiUsageMonthly.id, existing.id));
  } else {
    await db.insert(aiUsageMonthly).values({
      tenantId,
      periodMonth,
      generations: input.incrementGenerations ? 1 : 0,
      tokensUsed: input.tokensUsed ?? 0,
    });
  }
}

export async function getTenantOwnerContact(tenantId: string): Promise<{
  phone: string | null;
  email: string | null;
  displayName: string | null;
}> {
  const db = getDb();
  const [user] = await db
    .select({
      phone: users.phone,
      email: users.email,
      profileJson: users.profileJson,
    })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.role, "seller_owner")))
    .limit(1);

  const profile = user?.profileJson as { displayName?: string } | null;
  return {
    phone: user?.phone ?? null,
    email: user?.email ?? null,
    displayName: profile?.displayName ?? null,
  };
}
