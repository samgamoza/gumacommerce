import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildDefaultSeo,
  getTenantSeoState,
  normalizeSeoJson,
  saveTenantSeoDraft,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { storefrontBaseUrl } from "@/lib/utils";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const state = await getTenantSeoState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const defaults = buildDefaultSeo({
      name: state.name,
      category: state.category,
      slug: state.slug,
      storefrontBaseUrl,
    });

    return NextResponse.json({
      ok: true,
      draft: state.draft.siteTitle || state.draft.metaDescription ? state.draft : defaults,
      published: state.published,
      defaults,
      slug: state.slug,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[seo GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

const seoBodySchema = z.object({
  siteTitle: z.string().max(120).optional(),
  metaDescription: z.string().max(320).optional(),
  keywords: z.array(z.string().max(64)).max(30).optional(),
  canonicalUrl: z.string().max(2048).optional(),
  robots: z
    .object({
      index: z.boolean().optional(),
      follow: z.boolean().optional(),
      extraRules: z.array(z.string().max(200)).max(20).optional(),
    })
    .optional(),
  openGraph: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().max(320).optional(),
      imageUrl: z.string().max(2048).optional(),
      type: z.string().max(64).optional(),
    })
    .optional(),
  twitter: z
    .object({
      card: z.enum(["summary", "summary_large_image"]).optional(),
      title: z.string().max(120).optional(),
      description: z.string().max(320).optional(),
      imageUrl: z.string().max(2048).optional(),
    })
    .optional(),
  jsonLd: z.array(z.record(z.unknown())).max(10).optional(),
  rationale: z.string().max(500).optional(),
});

/** Save SEO draft only — does not publish. */
export async function PUT(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = seoBodySchema.parse(await request.json());
    const draft = await saveTenantSeoDraft(session.tenantId, normalizeSeoJson(body));

    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.SEO_UPDATED,
      data: {
        tenantId: session.tenantId,
        siteTitle: draft.siteTitle,
      },
      idempotencyKey: `Seo.Updated.V1:${session.tenantId}:${Date.now()}`,
    });

    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid SEO data." },
        { status: 400 }
      );
    }
    console.error("[seo PUT]", error);
    return NextResponse.json({ ok: false, error: "Could not save SEO draft." }, { status: 500 });
  }
}
