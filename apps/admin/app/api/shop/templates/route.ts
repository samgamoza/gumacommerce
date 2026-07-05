import { NextResponse } from "next/server";
import {
  SHOP_TEMPLATES,
  TIER_DESCRIPTIONS,
  TIER_LABELS,
  canUseTemplate,
  normalizeShopTemplateId,
} from "@guma-commerce/storefront-themes";
import { getTenantStorefrontSettings } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const settings = await getTenantStorefrontSettings(session.tenantId);
    const plan = settings?.subscriptionPlan ?? "free";

    return NextResponse.json({
      ok: true,
      tiers: (["basic", "standard", "advanced"] as const).map((tier) => ({
        tier,
        label: TIER_LABELS[tier],
        description: TIER_DESCRIPTIONS[tier],
        templates: SHOP_TEMPLATES.filter((template) => template.tier === tier).map((template) => ({
          id: template.id,
          label: template.label,
          description: template.description,
          mood: template.mood,
          tags: template.tags,
          previewGradient: template.previewGradient,
          minPlan: template.minPlan,
          locked: !canUseTemplate(template.id, plan),
        })),
      })),
      currentTemplateId: normalizeShopTemplateId(settings?.themeJson?.templateId ?? "clean-guma"),
      subscriptionPlan: plan,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[shop/templates GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
