import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantSettings, resolveAgentSettings } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { runCampaignAgent, runPostingAgent } from "@/lib/agents/run-agents";
import { assertAiQuota } from "@/lib/agents/usage-gate";

const runSchema = z.object({
  agentKey: z.enum(["posting", "campaign", "all"]),
});

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = runSchema.parse(await request.json());
    const settings = await getTenantSettings(session.tenantId);
    if (!settings) {
      return NextResponse.json({ ok: false, error: "Tenant not found." }, { status: 404 });
    }

    const task =
      body.agentKey === "campaign"
        ? "agent_campaign"
        : body.agentKey === "posting"
          ? "agent_post"
          : "agent_post";

    const quota = await assertAiQuota(session.tenantId, task);
    if (!quota.allowed) {
      return NextResponse.json(
        { ok: false, error: quota.reason, usage: quota.usage, upgradeRequired: true },
        { status: 402 }
      );
    }

    if (body.agentKey === "all") {
      const campaignQuota = await assertAiQuota(session.tenantId, "agent_campaign");
      if (!campaignQuota.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: campaignQuota.reason,
            usage: campaignQuota.usage,
            upgradeRequired: true,
          },
          { status: 402 }
        );
      }
    }

    const agentSettings = resolveAgentSettings(settings.settings as Record<string, unknown>);
    const tenant = {
      tenantId: session.tenantId,
      slug: settings.slug,
      name: settings.name,
      category: settings.category,
      themeJson: settings.themeJson,
      settingsJson: settings.settings,
      subscriptionPlan: settings.subscriptionPlan,
    };

    let itemsCreated = 0;
    if (body.agentKey === "posting" || body.agentKey === "all") {
      itemsCreated += await runPostingAgent(tenant, agentSettings);
    }
    if (body.agentKey === "campaign" || body.agentKey === "all") {
      itemsCreated += await runCampaignAgent(tenant);
    }

    return NextResponse.json({ ok: true, itemsCreated });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("Agents run error:", error);
    return NextResponse.json({ ok: false, error: "Agent run failed." }, { status: 500 });
  }
}
