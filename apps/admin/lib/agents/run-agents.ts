import { createAiGenerator } from "@guma-commerce/ai";
import {
  createContentQueueItem,
  finishAgentRun,
  getOrderInsightsLast7d,
  listProductsForTenant,
  pickFeaturedProductId,
  recordAiUsage,
  startAgentRun,
  type AgentSettings,
} from "@guma-commerce/db";
import { resolveShopTheme } from "@guma-commerce/storefront-themes";
import { getUsageSnapshot } from "@/lib/agents/usage-gate";

type TenantContext = {
  tenantId: string;
  slug: string;
  name: string;
  category: string | null;
  themeJson: unknown;
  settingsJson: unknown;
  subscriptionPlan: string | null;
};

function storefrontBase(): string {
  return process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";
}

function extractPostBody(output: unknown): { body: string; title?: string; mediaBrief?: string } {
  if (!output || typeof output !== "object") {
    return { body: "Generated post — review and edit before publishing." };
  }
  const record = output as Record<string, unknown>;
  const body =
    (typeof record.primary_text === "string" && record.primary_text) ||
    (typeof record.caption === "string" && record.caption) ||
    JSON.stringify(output, null, 2);
  const title =
    (typeof record.headline === "string" && record.headline) ||
    (typeof record.campaign_name === "string" && record.campaign_name) ||
    undefined;
  const mediaBrief =
    (typeof record.visual_brief === "string" && record.visual_brief) ||
    (typeof record.script === "object" ? "Video script included — see full output." : undefined);
  return { body, title, mediaBrief };
}

export async function runPostingAgent(
  tenant: TenantContext,
  agentSettings: AgentSettings
): Promise<number> {
  const runId = await startAgentRun(tenant.tenantId, "posting");
  let itemsCreated = 0;
  let tokensUsed = 0;

  try {
    const [products, insights] = await Promise.all([
      listProductsForTenant(tenant.tenantId),
      getOrderInsightsLast7d(tenant.tenantId),
    ]);
    const active = products.filter((p) => p.status === "active");
    const featuredId = await pickFeaturedProductId(
      tenant.tenantId,
      active.map((p) => p.id)
    );
    const featured =
      active.find((p) => p.id === featuredId) ?? active[0] ?? null;

    const theme = resolveShopTheme(
      tenant.themeJson as Parameters<typeof resolveShopTheme>[0],
      tenant.name
    );
    const orderLink = `${storefrontBase()}/${tenant.slug}?utm_source=guma_agents`;
    const generator = createAiGenerator();
    const usage = await getUsageSnapshot(tenant.tenantId);

    const insightContext = insights.insightLines.join(" ");
    const prompt = featured
      ? `Create today's post featuring bestseller "${featured.title}" at ₱${featured.basePrice}. Promo: ${theme.promoTitle ?? "Shop now"}. Shop context: ${insightContext}. Guma-style premium visual tone. Include clear order CTA.`
      : `Create a brand awareness post for ${tenant.name}. Highlight ${theme.tagline}. Context: ${insightContext}. Guma-style premium visual tone.`;

    const channels = agentSettings.channels.length ? agentSettings.channels : ["instagram"];

    for (const platform of channels) {
      const templateKey = platform === "tiktok" ? "tiktok_package" : "social_post";
      const result = await generator.generate({
        templateKey,
        userPrompt: prompt,
        subscriptionPlan: tenant.subscriptionPlan,
        taskType: "agent_post",
        tokensUsedThisMonth: usage.tokensThisMonth + tokensUsed,
        seller: {
          brandName: tenant.name,
          category: tenant.category ?? "General",
          location: "Philippines",
          tone: "gen_z_taglish",
          audience: "Filipino mobile shoppers",
          orderLink,
        },
        variables: { platform, goal: "conversion" },
      });

      tokensUsed += result.tokensUsed ?? 0;

      const { body, title, mediaBrief } = extractPostBody(result.output);
      const scheduledFor = new Date();
      scheduledFor.setHours(18, 0, 0, 0);
      if (scheduledFor.getTime() < Date.now()) {
        scheduledFor.setDate(scheduledFor.getDate() + 1);
      }

      await createContentQueueItem({
        tenantId: tenant.tenantId,
        agentKey: "posting",
        platform: platform as "instagram" | "tiktok" | "facebook",
        title: title ?? (featured ? `Spotlight: ${featured.title}` : "Today's post"),
        body,
        mediaBrief,
        outputJson: result.output,
        scheduledFor,
      });
      itemsCreated += 1;
    }

    await recordAiUsage(tenant.tenantId, { tokensUsed });
    await finishAgentRun(runId, { itemsCreated });
    return itemsCreated;
  } catch (error) {
    await finishAgentRun(runId, {
      itemsCreated,
      errorMessage: error instanceof Error ? error.message : "Agent run failed",
    });
    throw error;
  }
}

export async function runCampaignAgent(tenant: TenantContext): Promise<number> {
  const runId = await startAgentRun(tenant.tenantId, "campaign");
  let itemsCreated = 0;
  let tokensUsed = 0;

  try {
    const insights = await getOrderInsightsLast7d(tenant.tenantId);
    const theme = resolveShopTheme(
      tenant.themeJson as Parameters<typeof resolveShopTheme>[0],
      tenant.name
    );
    const orderLink = `${storefrontBase()}/${tenant.slug}?utm_source=guma_campaign`;
    const generator = createAiGenerator();
    const usage = await getUsageSnapshot(tenant.tenantId);

    const result = await generator.generate({
      templateKey: "campaign_strategy",
      userPrompt: `Plan a 7-day Guma-style video + social campaign for ${tenant.name}. Tagline: ${theme.tagline}. Orders last 7 days: ${insights.orderCount}. Revenue: ₱${insights.revenue}. ${insights.insightLines.join(" ")}`,
      subscriptionPlan: tenant.subscriptionPlan,
      taskType: "agent_campaign",
      tokensUsedThisMonth: usage.tokensThisMonth,
      seller: {
        brandName: tenant.name,
        category: tenant.category ?? "General",
        location: "Philippines",
        tone: "gen_z_taglish",
        audience: "Filipino mobile shoppers",
        orderLink,
      },
    });

    tokensUsed += result.tokensUsed ?? 0;

    const output = result.output as Record<string, unknown>;
    const dailyPlan = Array.isArray(output.daily_plan) ? output.daily_plan : [];

    if (dailyPlan.length > 0) {
      for (const [index, day] of dailyPlan.slice(0, 7).entries()) {
        const entry = day as Record<string, unknown>;
        const platform =
          entry.channel === "tiktok"
            ? "tiktok"
            : entry.channel === "instagram"
              ? "instagram"
              : "facebook";
        await createContentQueueItem({
          tenantId: tenant.tenantId,
          agentKey: "campaign",
          platform: platform as "instagram" | "tiktok" | "facebook",
          title:
            typeof entry.theme === "string" ? `Day ${index + 1}: ${entry.theme}` : `Day ${index + 1}`,
          body: [
            typeof entry.theme === "string" ? `Theme: ${entry.theme}` : null,
            Array.isArray(entry.posts) ? `Posts: ${entry.posts.join(", ")}` : null,
            typeof entry.promo === "string" ? `Promo: ${entry.promo}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          mediaBrief: "Guma-style video + carousel — premium lighting, minimal text overlays.",
          outputJson: entry,
          scheduledFor: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
        });
        itemsCreated += 1;
      }
    } else {
      const { body, title } = extractPostBody(result.output);
      await createContentQueueItem({
        tenantId: tenant.tenantId,
        agentKey: "campaign",
        platform: "instagram",
        title: title ?? "Weekly campaign plan",
        body,
        outputJson: result.output,
      });
      itemsCreated += 1;
    }

    await recordAiUsage(tenant.tenantId, { tokensUsed });
    await finishAgentRun(runId, { itemsCreated });
    return itemsCreated;
  } catch (error) {
    await finishAgentRun(runId, {
      itemsCreated,
      errorMessage: error instanceof Error ? error.message : "Campaign agent failed",
    });
    throw error;
  }
}

export type { TenantContext };
