import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTenantCheckoutState,
  normalizeCheckoutJson,
  saveTenantCheckoutDraft,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const couponSchema = z.object({
  code: z.string().trim().min(2).max(32),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive().max(100000),
  minSubtotal: z.number().min(0).optional(),
  maxRedemptions: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

const checkoutBodySchema = z.object({
  codEnabled: z.boolean().optional(),
  minOrderAmount: z.number().min(0).max(1000000).optional(),
  autoAcceptOrders: z.boolean().optional(),
  tax: z
    .object({
      enabled: z.boolean().optional(),
      ratePercent: z.number().min(0).max(100).optional(),
      inclusive: z.boolean().optional(),
    })
    .optional(),
  coupons: z.array(couponSchema).max(50).optional(),
  automaticDiscount: z
    .object({
      type: z.enum(["percent", "fixed"]),
      value: z.number().positive().max(100000),
      minSubtotal: z.number().min(0).optional(),
      label: z.string().max(80).optional(),
    })
    .nullable()
    .optional(),
  paymentAdapters: z
    .object({
      cod: z.boolean().optional(),
      paymongo: z
        .object({
          gcash: z.boolean().optional(),
          paymaya: z.boolean().optional(),
          qrph: z.boolean().optional(),
          card: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  customer: z
    .object({
      requireEmail: z.boolean().optional(),
      requireStructuredAddress: z.boolean().optional(),
    })
    .optional(),
  abandonedAfterMinutes: z.number().int().min(15).max(10080).optional(),
  rationale: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const session = await requireTenantSession();
    const state = await getTenantCheckoutState(session.tenantId);
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
    console.error("[checkout GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

/** Save checkout draft only — does not publish. */
export async function PUT(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = checkoutBodySchema.parse(await request.json());
    const draft = await saveTenantCheckoutDraft(session.tenantId, normalizeCheckoutJson(body));

    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.CHECKOUT_UPDATED,
      data: { tenantId: session.tenantId },
      idempotencyKey: `Checkout.Updated.V1:${session.tenantId}:${Date.now()}`,
    });

    return NextResponse.json({ ok: true, draft });
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
    console.error("[checkout PUT]", error);
    return NextResponse.json(
      { ok: false, error: "Could not save checkout draft." },
      { status: 500 }
    );
  }
}
