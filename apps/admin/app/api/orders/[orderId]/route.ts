import { NextResponse } from "next/server";
import { z } from "zod";
import {
  OrderError,
  applyOrderAction,
  orderBucketOf,
  rejectManualPaymentProof,
} from "@gumakart/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

/**
 * Seller order actions (Phase 2: actions, not statuses). Payment confirmation
 * has its own route (confirm-payment) and refunds go through /refund, which
 * handles the gateway.
 */
const patchSchema = z.object({
  action: z.enum([
    "accept",
    "mark_ready",
    "mark_out_for_delivery",
    "mark_delivered",
    "mark_failed_delivery",
    "mark_returned",
    "reject_payment",
    "cancel",
  ]),
  note: z.string().trim().max(500).optional(),
  reason: z.string().trim().max(200).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { orderId } = await params;
    z.string().uuid().parse(orderId);
    const body = patchSchema.parse(await request.json());

    if (body.action === "reject_payment") {
      const rejected = await rejectManualPaymentProof({
        tenantId: session.tenantId,
        orderId,
        actorId: session.userId,
        note: body.note,
      });
      if (!rejected.ok) {
        return NextResponse.json({ ok: false, error: rejected.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    const action =
      body.action === "accept"
        ? ({ type: "accept" } as const)
        : body.action === "mark_ready"
          ? ({ type: "mark_ready" } as const)
          : body.action === "cancel"
            ? ({ type: "cancel" } as const)
            : ({
                type: "fulfillment_update",
                to:
                  body.action === "mark_out_for_delivery"
                    ? "out_for_delivery"
                    : body.action === "mark_delivered"
                      ? "delivered"
                      : body.action === "mark_failed_delivery"
                        ? "failed_delivery"
                        : "returned",
              } as const);

    const result = await applyOrderAction({
      orderId,
      tenantId: session.tenantId,
      action,
      source: "seller",
      actorId: session.userId,
      note: body.note,
      cancelReason: body.reason,
    });

    return NextResponse.json({
      ok: true,
      changed: result.changed,
      orderState: result.after.orderState,
      paymentState: result.after.paymentState,
      fulfillmentState: result.after.fulfillmentState,
      bucket: orderBucketOf(result.after),
      cancelCourierBooking: result.cancelCourierBooking,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof OrderError) {
      const status = error.code === "ORDER_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("[orders PATCH]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
