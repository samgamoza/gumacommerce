import { NextResponse } from "next/server";
import {
  listActiveTenantsForAgents,
  resolveAgentSettings,
} from "@guma-commerce/db";
import { runCampaignAgent, runPostingAgent } from "@/lib/agents/run-agents";
import { assertAiQuota } from "@/lib/agents/usage-gate";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "daily";
  const tenants = await listActiveTenantsForAgents();
  let processed = 0;
  let itemsCreated = 0;

  for (const tenant of tenants) {
    const settings = resolveAgentSettings(tenant.settingsJson as Record<string, unknown>);
    if (!settings.postingEnabled && !settings.campaignEnabled) continue;

    const ctx = {
      tenantId: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      category: tenant.category,
      themeJson: tenant.themeJson,
      settingsJson: tenant.settingsJson,
      subscriptionPlan: tenant.subscriptionPlan,
    };

    try {
      if (settings.postingEnabled && (mode === "daily" || settings.postingSchedule === "daily")) {
        if (settings.postingSchedule !== "manual") {
          const quota = await assertAiQuota(tenant.id, "agent_post");
          if (!quota.allowed) continue;

          itemsCreated += await runPostingAgent(ctx, settings);
          processed += 1;
        }
      }
      if (
        settings.campaignEnabled &&
        (mode === "weekly" || settings.postingSchedule === "weekly")
      ) {
        const quota = await assertAiQuota(tenant.id, "agent_campaign");
        if (!quota.allowed) continue;

        itemsCreated += await runCampaignAgent(ctx);
        processed += 1;
      }
    } catch (error) {
      console.error(`Cron agent failed for ${tenant.slug}:`, error);
    }
  }

  return NextResponse.json({ ok: true, processed, itemsCreated });
}
