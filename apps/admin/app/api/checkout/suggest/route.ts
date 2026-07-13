import { NextResponse } from "next/server";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getTenantCheckoutState,
  normalizeCheckoutJson,
  recordAiUsage,
  saveTenantCheckoutDraft,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";

/**
 * AI checkout draft → change_request (domain checkout). Never publishes.
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

    const state = await getTenantCheckoutState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const before = normalizeCheckoutJson(state.published);
    const suggested = normalizeCheckoutJson({
      ...before,
      ...state.draft,
      tax: {
        enabled: true,
        ratePercent: 12,
        inclusive: false,
      },
      coupons:
        state.draft.coupons && state.draft.coupons.length > 0
          ? state.draft.coupons
          : [
              {
                code: "WELCOME10",
                type: "percent",
                value: 10,
                minSubtotal: 299,
                active: true,
              },
            ],
      automaticDiscount: null,
      paymentAdapters: {
        cod: true,
        paymongo: { gcash: true, paymaya: true, qrph: true, card: false },
      },
      customer: {
        requireEmail: false,
        requireStructuredAddress: true,
      },
      abandonedAfterMinutes: 45,
      rationale:
        "Suggested enabling 12% VAT, a WELCOME10 coupon, structured address, and 45m abandoned-checkout detection.",
    });

    await saveTenantCheckoutDraft(session.tenantId, suggested);

    const approvalLevel = resolveApprovalLevel("ai.suggest.checkout", quota.usage.plan);
    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "checkout",
      scope: "ai.suggest.checkout",
      approvalLevel,
      proposedByType: "ai",
      proposedByUserId: session.userId,
      summary: "AI checkout suggestion: tax + coupon + address fields".slice(0, 255),
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: suggested as unknown as Record<string, unknown>,
    });

    await recordAiUsage(session.tenantId, {
      incrementGenerations: true,
      tokensUsed: 60,
    });

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
      changeRequestId: changeRequest.id,
      approvalLevel,
      requiresReview: approvalLevel !== "automatic",
      suggestion: suggested,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[checkout suggest]", error);
    return NextResponse.json({ ok: false, error: "Suggest failed." }, { status: 500 });
  }
}
