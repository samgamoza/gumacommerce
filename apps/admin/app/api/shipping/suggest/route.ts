import { NextResponse } from "next/server";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getTenantShippingState,
  normalizeShippingJson,
  recordAiUsage,
  saveTenantShippingDraft,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";

/**
 * AI shipping draft → change_request (domain shipping). Never publishes.
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

    const state = await getTenantShippingState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const before = normalizeShippingJson(state.published);
    const baseProfile = before.profiles[0] ?? {
      id: "default",
      name: "Default",
      enabled: true,
      methods: [],
    };

    const suggested = normalizeShippingJson({
      ...before,
      profiles: [
        {
          ...baseProfile,
          id: "default",
          name: "Default",
          enabled: true,
          methods: [
            {
              id: "flat-metro",
              type: "flat",
              label: "Metro delivery",
              enabled: true,
              zones: [
                {
                  id: "zone-ncr",
                  name: "Metro Manila",
                  match: { provinces: ["Metro Manila", "NCR"], cities: ["Manila", "Quezon City", "Makati"] },
                },
              ],
              rates: [
                { id: "rate-ncr-flat", basis: "flat", amount: 79 },
                { id: "rate-ncr-price", basis: "price", min: 0, max: 499, amount: 99 },
                { id: "rate-ncr-price-hi", basis: "price", min: 500, max: null, amount: 0 },
              ],
              freeAboveSubtotal: 500,
              etaMinutes: { min: 45, max: 120 },
            },
            {
              id: "local-default",
              type: "local_delivery",
              label: "Local delivery",
              enabled: true,
              zones: [],
              rates: [{ id: "rate-local", basis: "flat", amount: 59 }],
              freeAboveSubtotal: 400,
              etaMinutes: { min: 30, max: 90 },
            },
            {
              id: "courier-lalamove",
              type: "courier",
              label: "Lalamove",
              enabled: true,
              provider: "lalamove",
              fallbackFlatRate: 89,
              freeAboveSubtotal: 800,
              etaMinutes: { min: 40, max: 100 },
            },
            {
              id: "pickup-default",
              type: "pickup",
              label: "Store pickup",
              enabled: true,
              instructions: "Ready for pickup after confirmation SMS.",
              etaMinutes: { min: 20, max: 45 },
            },
          ],
        },
      ],
      rationale:
        "Suggested Metro Manila zone rates, local delivery, Lalamove courier fallback, free-shipping thresholds, and pickup ETA.",
    });

    await saveTenantShippingDraft(session.tenantId, suggested);

    const approvalLevel = resolveApprovalLevel("ai.suggest.shipping", quota.usage.plan);
    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "shipping",
      scope: "ai.suggest.shipping",
      approvalLevel,
      proposedByType: "ai",
      proposedByUserId: session.userId,
      summary: "AI shipping suggestion: zones + rates + courier".slice(0, 255),
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: suggested as unknown as Record<string, unknown>,
    });

    await recordAiUsage(session.tenantId, {
      incrementGenerations: true,
      tokensUsed: 70,
    });

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
    await emitDomainEvent({
      name: EVENT_NAMES.SHIPPING_PROFILE_CREATED,
      data: {
        tenantId: session.tenantId,
        profileId: "default",
        profileName: "Default",
        changeRequestId: changeRequest.id,
      },
      idempotencyKey: `Shipping.ProfileCreated.V1:${changeRequest.id}:default`,
    });
    await emitDomainEvent({
      name: EVENT_NAMES.SHIPPING_RULE_CHANGED,
      data: {
        tenantId: session.tenantId,
        changeRequestId: changeRequest.id,
        ruleKind: "zone",
      },
      idempotencyKey: `Shipping.RuleChanged.V1:${changeRequest.id}`,
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
    console.error("[shipping suggest]", error);
    return NextResponse.json({ ok: false, error: "Suggest failed." }, { status: 500 });
  }
}
