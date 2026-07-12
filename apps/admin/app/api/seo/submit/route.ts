import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getTenantSeoState,
  normalizeSeoJson,
  saveTenantSeoDraft,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const bodySchema = z.object({
  seo: z.record(z.unknown()),
  summary: z.string().max(255).optional(),
});

/**
 * Submit current SEO draft as a change request for human approval → publish.
 * Does not publish live SEO.
 */
export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = bodySchema.parse(await request.json());
    const state = await getTenantSeoState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const after = normalizeSeoJson(body.seo);
    const before = normalizeSeoJson(state.published);
    // Matrix: ai.suggest.seo is human_review on all plans.
    const approvalLevel = resolveApprovalLevel("ai.suggest.seo", "free");

    await saveTenantSeoDraft(session.tenantId, after);

    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "seo",
      scope: "ai.suggest.seo",
      approvalLevel,
      proposedByType: "user",
      proposedByUserId: session.userId,
      summary: (body.summary ?? `SEO update: ${after.siteTitle || state.name}`).slice(0, 255),
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: after as unknown as Record<string, unknown>,
    });

    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.SEO_UPDATED,
      data: {
        tenantId: session.tenantId,
        changeRequestId: changeRequest.id,
        siteTitle: after.siteTitle,
      },
      idempotencyKey: `Seo.Updated.V1:${changeRequest.id}`,
    });

    return NextResponse.json({
      ok: true,
      changeRequestId: changeRequest.id,
      approvalLevel,
      requiresReview: true,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid SEO payload." }, { status: 400 });
    }
    console.error("[seo/submit POST]", error);
    return NextResponse.json({ ok: false, error: "Could not submit SEO change." }, { status: 500 });
  }
}
