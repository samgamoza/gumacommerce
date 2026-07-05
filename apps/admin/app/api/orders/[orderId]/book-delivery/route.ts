import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createDeliveryBooking,
  getOrderForDeliveryBooking,
  getTenantOwnerContact,
  getTenantSettings,
  recordDeliveryQuote,
} from "@guma-commerce/db";
import {
  createLalamoveClient,
  createLogger,
  geocodeAddress,
} from "@guma-commerce/services";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const log = createLogger("orders:book-delivery");

/** Books a Lalamove rider for a paid/accepted delivery order. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { orderId } = await params;
    z.string().uuid().parse(orderId);

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
    if (order.existingProviderOrderId) {
      return NextResponse.json(
        { ok: false, error: "A rider is already booked for this order." },
        { status: 409 }
      );
    }
    if (!["paid", "accepted", "preparing", "ready_for_pickup"].includes(order.status)) {
      return NextResponse.json(
        { ok: false, error: `Cannot book a rider while the order is "${order.status}".` },
        { status: 400 }
      );
    }
    if (order.dropoffAddress.trim().length < 10) {
      return NextResponse.json(
        { ok: false, error: "The order has no usable delivery address." },
        { status: 400 }
      );
    }

    const tenantSettings = await getTenantSettings(session.tenantId);
    const pickupAddress = tenantSettings?.settings?.delivery?.pickupAddress?.trim() ?? "";
    if (!pickupAddress) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Set your store pickup address first (Settings → Delivery & Shipping).",
        },
        { status: 400 }
      );
    }

    const [pickup, dropoff] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(order.dropoffAddress),
    ]);
    if (!pickup || !dropoff) {
      return NextResponse.json(
        { ok: false, error: "Could not locate the pickup or delivery address on the map." },
        { status: 400 }
      );
    }

    const lalamove = createLalamoveClient();
    // Lalamove quotes expire after ~5 minutes, so always book from a fresh one.
    const quote = await lalamove.getQuotation({
      pickup: { address: pickupAddress, coordinates: { lat: pickup.lat, lng: pickup.lng } },
      dropoff: {
        address: order.dropoffAddress,
        coordinates: { lat: dropoff.lat, lng: dropoff.lng },
      },
    });

    const owner = await getTenantOwnerContact(session.tenantId);
    const senderPhone =
      tenantSettings?.settings?.whatsapp?.phone?.trim() || owner.phone || undefined;

    const booking = await lalamove.bookDelivery({
      quotationId: quote.quotationId,
      stopIds: quote.stopIds,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      senderName: session.tenantName,
      senderPhone,
      remarks: [order.orderNumber, order.dropoffNotes].filter(Boolean).join(" · "),
    });

    const quoteRowId = await recordDeliveryQuote({
      tenantId: session.tenantId,
      orderId: order.orderId,
      provider: "lalamove",
      quoteId: quote.quotationId,
      fee: quote.fee.toFixed(2),
      etaMinutes: quote.etaMinutes,
      expiresAt: quote.expiresAt ? new Date(quote.expiresAt) : undefined,
    });

    await createDeliveryBooking({
      orderId: order.orderId,
      quoteId: quoteRowId,
      provider: "lalamove",
      providerOrderId: booking.orderId,
      status: booking.status,
      trackingUrl: booking.trackingUrl,
    });

    return NextResponse.json({
      ok: true,
      delivery: {
        providerOrderId: booking.orderId,
        status: booking.status,
        trackingUrl: booking.trackingUrl ?? null,
        fee: quote.fee,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid order id." }, { status: 400 });
    }
    log.error("Rider booking failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not book a rider right now. Try again shortly." },
      { status: 502 }
    );
  }
}
