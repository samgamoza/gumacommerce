import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTenantShippingState,
  normalizeShippingJson,
  saveTenantShippingDraft,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const shippingBodySchema = z.object({
  version: z.literal(1).optional(),
  defaultProfileId: z.string().max(64).optional(),
  profiles: z.array(z.record(z.unknown())).max(20).optional(),
  origin: z
    .object({
      address: z.string().max(500).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  notes: z.string().max(1000).optional(),
  rationale: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const session = await requireTenantSession();
    const state = await getTenantShippingState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      draft: state.draft,
      published: state.published,
      slug: state.slug,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[shipping GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

/** Save shipping draft only — does not publish. */
export async function PUT(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = shippingBodySchema.parse(await request.json());
    const draft = await saveTenantShippingDraft(
      session.tenantId,
      normalizeShippingJson(body)
    );

    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.SHIPPING_UPDATED,
      data: { tenantId: session.tenantId },
      idempotencyKey: `Shipping.Updated.V1:${session.tenantId}:${Date.now()}`,
    });
    await emitDomainEvent({
      name: EVENT_NAMES.SHIPPING_RULE_CHANGED,
      data: { tenantId: session.tenantId, ruleKind: "rate" },
      idempotencyKey: `Shipping.RuleChanged.V1:${session.tenantId}:${Date.now()}`,
    });

    return NextResponse.json({ ok: true, draft });
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
    console.error("[shipping PUT]", error);
    return NextResponse.json(
      { ok: false, error: "Could not save shipping draft." },
      { status: 500 }
    );
  }
}
