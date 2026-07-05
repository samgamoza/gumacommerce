import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiGenerator, type TemplateKey } from "@guma-commerce/ai";
import { getTenantSettings, recordAiUsage } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";

const generateSchema = z.object({
  templateKey: z.enum([
    "tiktok_package",
    "social_post",
    "product_listing",
    "campaign_strategy",
    "support_chatbot",
  ]),
  userPrompt: z.string().min(3),
  seller: z.object({
    brandName: z.string(),
    category: z.string(),
    location: z.string(),
    tone: z.enum(["friendly_taglish", "professional_en", "gen_z_taglish"]).default("friendly_taglish"),
    audience: z.string().default("Filipino mobile shoppers"),
    orderLink: z.string().url(),
  }),
  variables: z.record(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = generateSchema.parse(await request.json());

    const quota = await assertAiQuota(session.tenantId, "generation");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason, upgradeRequired: true, usage: quota.usage },
        { status: 402 }
      );
    }

    const settings = await getTenantSettings(session.tenantId);
    const generator = createAiGenerator();

    const result = await generator.generate({
      templateKey: body.templateKey as TemplateKey,
      userPrompt: body.userPrompt,
      seller: body.seller,
      variables: body.variables,
      subscriptionPlan: settings?.subscriptionPlan,
      taskType: "generation",
      tokensUsedThisMonth: quota.usage.tokensThisMonth,
    });

    await recordAiUsage(session.tenantId, {
      incrementGenerations: true,
      tokensUsed: result.tokensUsed,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("AI generate error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 400 });
  }
}
