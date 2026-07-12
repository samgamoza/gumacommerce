import { NextResponse } from "next/server";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  buildDefaultSeo,
  createChangeRequest,
  getTenantSeoState,
  normalizeSeoJson,
  recordAiUsage,
  saveTenantSeoDraft,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";
import { storefrontBaseUrl } from "@/lib/utils";

/**
 * AI SEO draft → change_request (domain seo). Never publishes.
 */
export async function POST() {
  try {
    const session = await requireTenantSession();
    const quota = await assertAiQuota(session.tenantId, "generation");
    if (!quota.allowed) {
      return NextResponse.json(
        { ok: false, error: quota.reason, upgradeRequired: true, usage: quota.usage },
        { status: 402 }
      );
    }

    const state = await getTenantSeoState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const baseline = buildDefaultSeo({
      name: state.name,
      category: state.category,
      slug: state.slug,
      storefrontBaseUrl,
    });
    const before = normalizeSeoJson(state.published.siteTitle ? state.published : baseline);

    const suggested = normalizeSeoJson({
      ...baseline,
      ...state.draft,
      siteTitle: `${state.name} | ${state.category ?? "Online Shop"} — Order Online`,
      metaDescription: `Shop ${state.name}${
        state.category ? ` for ${state.category}` : ""
      }. Fast checkout, COD & e-wallets. Trusted Filipino sellers on Guma Commerce.`,
      keywords: [
        state.name,
        state.category ?? "shop",
        "Philippines",
        "COD",
        "online store",
        "Guma Commerce",
      ].filter(Boolean) as string[],
      openGraph: {
        title: `${state.name} — ${state.category ?? "Shop"}`,
        description: `Browse ${state.name} and order online. COD available.`,
        imageUrl: before.openGraph?.imageUrl ?? "",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${state.name} — Shop`,
        description: `Order from ${state.name} online.`,
        imageUrl: before.twitter?.imageUrl ?? "",
      },
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          name: state.name,
          url: baseline.canonicalUrl,
          description: `Shop ${state.name} online.`,
          areaServed: "PH",
        },
      ],
      rationale:
        "Suggested clearer title/description and social cards for search + share previews.",
    });

    await saveTenantSeoDraft(session.tenantId, suggested);

    const approvalLevel = resolveApprovalLevel("ai.suggest.seo", quota.usage.plan);
    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "seo",
      scope: "ai.suggest.seo",
      approvalLevel,
      proposedByType: "ai",
      proposedByUserId: session.userId,
      summary: `AI SEO suggestion: ${suggested.siteTitle}`.slice(0, 255),
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: suggested as unknown as Record<string, unknown>,
    });

    await recordAiUsage(session.tenantId, {
      incrementGenerations: true,
      tokensUsed: 80,
    });

    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.SEO_UPDATED,
      data: {
        tenantId: session.tenantId,
        changeRequestId: changeRequest.id,
        siteTitle: suggested.siteTitle,
      },
      idempotencyKey: `Seo.Updated.V1:${changeRequest.id}`,
    });

    return NextResponse.json({
      ok: true,
      changeRequestId: changeRequest.id,
      approvalLevel,
      requiresReview: approvalLevel !== "automatic",
      before,
      suggestion: suggested,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[seo/suggest POST]", error);
    return NextResponse.json({ ok: false, error: "Could not suggest SEO." }, { status: 500 });
  }
}
