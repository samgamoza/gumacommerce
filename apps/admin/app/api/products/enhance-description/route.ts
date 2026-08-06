import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiGenerator, resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getTenantDashboard,
  recordAiUsage,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
});

interface AiListingOutput {
  title?: string;
  description_html?: string;
  short_description?: string;
}

function plainToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (!escaped.trim()) return "";
  return `<p>${escaped.replace(/\n/g, "</p><p>")}</p>`;
}

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = schema.parse(await request.json());

    const quota = await assertAiQuota(session.tenantId, "generation");
    if (!quota.allowed) {
      return NextResponse.json(
        { ok: false, error: quota.reason, upgradeRequired: true, usage: quota.usage },
        { status: 402 }
      );
    }

    const dashboard = await getTenantDashboard(session.tenantId, session.userId);
    if (!dashboard) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const category = dashboard.tenant.category ?? "General";
    const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";
    const generator = createAiGenerator();

    const currentNotes = body.description.trim() || "No draft yet — write a clear, selling description.";
    const result = await generator.generate({
      templateKey: "product_listing",
      userPrompt: [
        `Shop "${dashboard.tenant.name}" sells ${category}.`,
        `Enhance ONLY the product description. Keep the product name "${body.title.trim()}".`,
        `Do not invent a different product. Improve clarity, benefits, and Taglish-friendly tone.`,
        `Seller description: ${body.title.trim()}. ${currentNotes}`,
      ].join(" "),
      seller: {
        brandName: dashboard.tenant.name,
        category,
        location: "Philippines",
        tone: "friendly_taglish",
        audience: "Filipino mobile shoppers on Facebook, TikTok, and Instagram",
        orderLink: `${storefrontUrl}/${dashboard.tenant.slug}`,
      },
      variables: {
        brand_name: dashboard.tenant.name,
        product_name: body.title.trim(),
        seller_notes: currentNotes,
        category,
      },
      subscriptionPlan: quota.usage.plan,
      taskType: "generation",
      tokensUsedThisMonth: quota.usage.tokensThisMonth,
    });

    await recordAiUsage(session.tenantId, {
      incrementGenerations: true,
      tokensUsed: result.tokensUsed,
    });

    const output = result.output as AiListingOutput;
    const descriptionHtml =
      output.description_html ??
      plainToHtml(output.short_description ?? currentNotes);
    const shortDescription =
      output.short_description ??
      body.description.trim().split("\n")[0] ??
      body.title.trim();

    const approvalLevel = resolveApprovalLevel("ai.rewrite.description", quota.usage.plan);
    const afterJson = {
      title: body.title.trim(),
      descriptionHtml,
      shortDescription,
    };

    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "catalog",
      scope: "ai.rewrite.description",
      approvalLevel,
      proposedByType: "ai",
      proposedByUserId: session.userId,
      summary: `AI enhanced description: ${body.title.trim()}`.slice(0, 255),
      beforeJson: {
        title: body.title.trim(),
        description: body.description,
      },
      afterJson,
    });

    return NextResponse.json({
      ok: true,
      model: result.model,
      descriptionHtml,
      shortDescription,
      changeRequestId: changeRequest.id,
      approvalLevel,
      requiresReview: approvalLevel !== "automatic",
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("[products/enhance-description POST]", error);
    return NextResponse.json(
      { ok: false, error: "Could not enhance description." },
      { status: 500 }
    );
  }
}
