import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrderForDeliveryBooking,
  upsertManualDeliveryForOrder,
} from "@guma-commerce/db";
import { createLogger } from "@guma-commerce/services";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const log = createLogger("orders:assign-rider");

const bodySchema = z.object({
  driverName: z.string().trim().min(2).max(120),
  driverPhone: z.string().trim().min(7).max(32),
  driverPlateNumber: z.string().trim().max(32).optional(),
  trackingUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  courierLabel: z.string().trim().max(64).optional(),
});

/**
 * Manual / offline courier (Angkas, Move It, own rider, meetup).
 * Creates or updates the deliveries row without calling a partner API.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { orderId } = await params;
    z.string().uuid().parse(orderId);
    const body = bodySchema.parse(await request.json());

    const order = await getOrderForDeliveryBooking(session.tenantId, orderId);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    if (order.deliveryType !== "delivery") {
      return NextResponse.json(
        { ok: false, error: "This is a pickup order — no rider needed." },
        { status: 400 }
      );
    }
    if (!["paid", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(order.status)) {
      return NextResponse.json(
        { ok: false, error: `Cannot assign a rider while the order is "${order.status}".` },
        { status: 400 }
      );
    }

    const delivery = await upsertManualDeliveryForOrder({
      orderId: order.orderId,
      driverName: body.driverName,
      driverPhone: body.driverPhone,
      driverPlateNumber: body.driverPlateNumber,
      trackingUrl: body.trackingUrl,
      courierLabel: body.courierLabel,
    });

    return NextResponse.json({
      ok: true,
      delivery: {
        provider: "manual",
        providerOrderId: delivery.providerOrderId,
        status: delivery.status,
        driverName: body.driverName,
        driverPhone: body.driverPhone,
        trackingUrl: body.trackingUrl ?? null,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    log.error("Manual rider assign failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not save rider details." },
      { status: 500 }
    );
  }
}
