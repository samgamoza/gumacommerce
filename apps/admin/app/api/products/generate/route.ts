import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiGenerator } from "@guma-commerce/ai";
import { getTenantDashboard } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

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

    const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";
    const generator = createAiGenerator();

    const priceNote = body.priceHint ? ` Target price around ₱${body.priceHint}.` : "";
    const result = await generator.generate({
      templateKey: "product_listing",
      userPrompt: `${body.prompt.trim()}${priceNote}`,
      seller: {
        brandName: dashboard.tenant.name,
        category: dashboard.tenant.category ?? "General",
        location: "Philippines",
        tone: "friendly_taglish",
        audience: "Filipino mobile shoppers on Facebook, TikTok, and Instagram",
        orderLink: `${storefrontUrl}/${dashboard.tenant.slug}`,
      },
      variables: {
        product_name: body.prompt.trim(),
        seller_notes: `${body.prompt.trim()}${priceNote}`,
        category: dashboard.tenant.category ?? "General",
      },
    });

    const output = result.output as AiListingOutput;
    const suggestedPrice = output.suggested_price ?? body.priceHint ?? 299;

    return NextResponse.json({
      ok: true,
      model: result.model,
      listing: {
        title: output.title ?? body.prompt.trim(),
        slug: output.slug ?? body.prompt.trim(),
        descriptionHtml:
          output.description_html ??
          `<p>${output.short_description ?? body.prompt.trim()}</p>`,
        shortDescription: output.short_description ?? "",
        basePrice: suggestedPrice,
        compareAtPrice: output.compare_at_price ?? null,
        tags: output.tags ?? [],
        photoShotList: output.photo_shot_list ?? [],
      },
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
