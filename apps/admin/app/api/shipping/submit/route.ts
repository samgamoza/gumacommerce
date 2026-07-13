import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getTenantShippingState,
  normalizeShippingJson,
  saveTenantShippingDraft,
  submitChangeRequest,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const bodySchema = z.object({
  shipping: z.record(z.unknown()).optional(),
});

/** Submit shipping draft as a change request for Approvals. */
export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const state = await getTenantShippingState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const after = normalizeShippingJson(body.shipping ?? state.draft);
    await saveTenantShippingDraft(session.tenantId, after);

    const approvalLevel = resolveApprovalLevel("ai.suggest.shipping", "free");
    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "shipping",
      scope: "ai.suggest.shipping",
      approvalLevel,
      proposedByType: "user",
      proposedByUserId: session.userId,
      summary: `Shipping update: ${after.profiles.length} profile(s)`.slice(0, 255),
      beforeJson: state.published as unknown as Record<string, unknown>,
      afterJson: after as unknown as Record<string, unknown>,
    });

    const submitted = await submitChangeRequest(changeRequest.id, session.tenantId);

    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.SHIPPING_UPDATED,
      data: {
        tenantId: session.tenantId,
        changeRequestId: changeRequest.id,
      },
      idempotencyKey: `Shipping.Updated.V1:${changeRequest.id}`,
    });

    return NextResponse.json({
      ok: true,
      changeRequestId: submitted.id,
      status: submitted.status,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid shipping data." },
        { status: 400 }
      );
    }
    console.error("[shipping submit]", error);
    return NextResponse.json({ ok: false, error: "Submit failed." }, { status: 500 });
  }
}
