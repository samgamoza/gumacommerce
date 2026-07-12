import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTenantDashboard,
  getTenantStorefrontSettings,
  updateTenantStorefront,
} from "@guma-commerce/db";
import {
  canUseTemplate,
  isShopTemplateId,
  resolveShopTheme,
  resolveStorePattern,
} from "@guma-commerce/storefront-themes";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const updateSchema = z.object({
  templateId: z.string().min(1).max(64).optional(),
  tagline: z.string().max(160).optional(),
  promoTitle: z.string().max(120).optional(),
  promoSubtitle: z.string().max(160).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  displayFont: z.enum(["bricolage", "system", "mono-accent"]).optional(),
  paletteId: z.string().max(64).optional(),
  coverUrl: z.string().url().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
});

export async function GET() {
  try {
    const session = await requireTenantSession();
    const [dashboard, settings] = await Promise.all([
      getTenantDashboard(session.tenantId, session.userId),
      getTenantStorefrontSettings(session.tenantId),
    ]);

    if (!dashboard || !settings) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";
    const theme = resolveShopTheme(settings.themeJson, settings.name);
    const patternId = resolveStorePattern(settings.themeJson);

    return NextResponse.json({
      ok: true,
      shop: dashboard,
      storefront: settings,
      theme,
      patternId,
      urls: {
        storefront: `${storefrontUrl}/${dashboard.tenant.slug}`,
        preview: `${storefrontUrl}/${dashboard.tenant.slug}?preview=1`,
        orderLink: `${storefrontUrl}/${dashboard.tenant.slug}?utm_source=instagram`,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[shop GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = updateSchema.parse(await request.json());
    const settings = await getTenantStorefrontSettings(session.tenantId);

    if (!settings) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    if (body.templateId && !isShopTemplateId(body.templateId)) {
      return NextResponse.json({ ok: false, error: "Unknown shop template." }, { status: 400 });
    }

    if (
      body.templateId &&
      !canUseTemplate(body.templateId, settings.subscriptionPlan)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "This template requires a higher plan. Upgrade to unlock advanced designs.",
        },
        { status: 403 }
      );
    }

    const updated = await updateTenantStorefront(session.tenantId, {
      ...body,
      ...(body.templateId
        ? {
            patternId: matchStorePattern({
              templateId: body.templateId,
              category: settings.category,
              vibe: settings.themeJson?.vibe,
            }),
          }
        : {}),
    });
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const theme = resolveShopTheme(updated.themeJson, updated.name);
    const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

    return NextResponse.json({
      ok: true,
      storefront: updated,
      theme,
      urls: {
        storefront: `${storefrontUrl}/${updated.slug}`,
        preview: `${storefrontUrl}/${updated.slug}?preview=1`,
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
    console.error("[shop PATCH]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
