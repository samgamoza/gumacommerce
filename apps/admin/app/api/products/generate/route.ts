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

const generateSchema = z.object({
  prompt: z.string().min(3).max(2000),
  priceHint: z.number().positive().max(999999).optional(),
});

interface AiListingOutput {
  title?: string;
  slug?: string;
  description_html?: string;
  short_description?: string;
  suggested_price?: number;
  compare_at_price?: number | null;
  tags?: string[];
  photo_shot_list?: string[];
}

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = generateSchema.parse(await request.json());
    const dashboard = await getTenantDashboard(session.tenantId, session.userId);

    if (!dashboard) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const quota = await assertAiQuota(session.tenantId, "generation");
    if (!quota.allowed) {
      return NextResponse.json(
        { ok: false, error: quota.reason, upgradeRequired: true, usage: quota.usage },
        { status: 402 }
      );
    }

    const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";
    const generator = createAiGenerator();

    const category = dashboard.tenant.category ?? "General";
    const priceNote = body.priceHint ? ` Target price around ₱${body.priceHint}.` : "";
    const sellerNotes = `${body.prompt.trim()}.${priceNote}`.trim();
    const result = await generator.generate({
      templateKey: "product_listing",
      userPrompt: [
        `Shop "${dashboard.tenant.name}" sells ${category}.`,
        `Write a product listing ONLY for this category.`,
        `Seller description: ${sellerNotes}`,
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
        product_name: body.prompt.trim(),
        seller_notes: sellerNotes,
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
    const suggestedPrice = output.suggested_price ?? body.priceHint ?? 299;
    const rawTitle = (output.title ?? body.prompt.trim()).trim();
    const title =
      /^Shop\s+"/i.test(rawTitle) || /^Write a product listing/i.test(rawTitle)
        ? body.prompt.trim()
        : rawTitle;
    const listing = {
      title,
      slug: output.slug ?? title,
      descriptionHtml:
        output.description_html ??
        `<p>${output.short_description ?? title}</p>`,
      shortDescription: output.short_description ?? "",
      basePrice: suggestedPrice,
      compareAtPrice: output.compare_at_price ?? null,
      tags: output.tags ?? [],
      photoShotList: output.photo_shot_list ?? [],
      stockQty: 10,
      status: "active" as const,
      aiGenerated: true,
    };

    const approvalLevel = resolveApprovalLevel(
      "ai.rewrite.description",
      quota.usage.plan
    );

    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "catalog",
      scope: "ai.rewrite.description",
      approvalLevel,
      proposedByType: "ai",
      proposedByUserId: session.userId,
      summary: `AI product listing: ${listing.title}`.slice(0, 255),
      beforeJson: null,
      afterJson: listing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      ok: true,
      model: result.model,
      listing,
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
    console.error("[products/generate POST]", error);
    return NextResponse.json({ ok: false, error: "AI generation failed." }, { status: 500 });
  }
}
