import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrderInsightsLast7d,
  getTenantSettings,
  listContentQueue,
  listRecentAgentRuns,
  resolveAgentSettings,
  resolveShopAssistantSettings,
  updateTenantSettings,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { buildDailyBriefing, groupQueueByDay } from "@/lib/agents/briefing";
import { getUsageSnapshot } from "@/lib/agents/usage-gate";
import { normalizePlan, resolveModelForTask } from "@guma-commerce/ai";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const settings = await getTenantSettings(session.tenantId);
    if (!settings) {
      return NextResponse.json({ ok: false, error: "Tenant not found." }, { status: 404 });
    }

    const [queue, runs, usage, orderInsights] = await Promise.all([
      listContentQueue(session.tenantId),
      listRecentAgentRuns(session.tenantId),
      getUsageSnapshot(session.tenantId),
      getOrderInsightsLast7d(session.tenantId),
    ]);

    const briefing = buildDailyBriefing(settings.name, orderInsights, queue);
    const plan = normalizePlan(settings.subscriptionPlan);

    return NextResponse.json({
      ok: true,
      agents: resolveAgentSettings(settings.settings as Record<string, unknown>),
      shopAssistant: resolveShopAssistantSettings(settings.settings as Record<string, unknown>),
      queue,
      queueCalendar: groupQueueByDay(queue),
      runs,
      usage,
      briefing,
      orderInsights,
      models: {
        agentPost: resolveModelForTask(plan, "agent_post"),
        agentCampaign: resolveModelForTask(plan, "agent_campaign"),
        chat: resolveModelForTask(plan, "chat"),
      },
      subscriptionPlan: plan,
    });
  } catch (error) {    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("Agents GET error:", error);
    return NextResponse.json({ ok: false, error: "Could not load agents." }, { status: 500 });
  }
}

const configSchema = z.object({
  agents: z
    .object({
      postingEnabled: z.boolean().optional(),
      campaignEnabled: z.boolean().optional(),
      postingSchedule: z.enum(["daily", "weekly", "manual"]).optional(),
      postingTime: z.string().optional(),
      weeklyDay: z.number().min(0).max(6).optional(),
      channels: z.array(z.enum(["instagram", "tiktok", "facebook"])).optional(),
    })
    .optional(),
  shopAssistant: z
    .object({
      enabled: z.boolean().optional(),
      name: z.string().max(80).optional(),
      greeting: z.string().max(500).optional(),
      tone: z.enum(["friendly_taglish", "professional_en", "gen_z_taglish"]).optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = configSchema.parse(await request.json());
    const updated = await updateTenantSettings(session.tenantId, {
      settings: {
        ...(body.agents ? { agents: body.agents } : {}),
        ...(body.shopAssistant ? { shopAssistant: body.shopAssistant } : {}),
      },
    });
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Could not save." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("Agents PATCH error:", error);
    return NextResponse.json({ ok: false, error: "Could not save settings." }, { status: 400 });
  }
}
