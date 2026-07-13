import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getTenantCheckoutState,
  normalizeCheckoutJson,
  saveTenantCheckoutDraft,
  submitChangeRequest,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const bodySchema = z.object({
  checkout: z.record(z.unknown()).optional(),
});

/** Submit checkout draft as a change request for Approvals. */
export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const state = await getTenantCheckoutState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const after = normalizeCheckoutJson(body.checkout ?? state.draft);
    await saveTenantCheckoutDraft(session.tenantId, after);

    // Matrix: ai.suggest.checkout is human_review on all plans.
    const approvalLevel = resolveApprovalLevel("ai.suggest.checkout", "free");
    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "checkout",
      scope: "ai.suggest.checkout",
      approvalLevel,
      proposedByType: "user",
      proposedByUserId: session.userId,
      summary: `Checkout update: min ₱${after.minOrderAmount ?? 0}, COD ${
        after.codEnabled ? "on" : "off"
      }`.slice(0, 255),
      beforeJson: state.published as unknown as Record<string, unknown>,
      afterJson: after as unknown as Record<string, unknown>,
    });

    const submitted = await submitChangeRequest(changeRequest.id, session.tenantId);

    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.CHECKOUT_UPDATED,
      data: {
        tenantId: session.tenantId,
        changeRequestId: changeRequest.id,
      },
      idempotencyKey: `Checkout.Updated.V1:${changeRequest.id}`,
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
        { ok: false, error: error.errors[0]?.message ?? "Invalid checkout data." },
        { status: 400 }
      );
    }
    console.error("[checkout submit]", error);
    return NextResponse.json({ ok: false, error: "Submit failed." }, { status: 500 });
  }
}
