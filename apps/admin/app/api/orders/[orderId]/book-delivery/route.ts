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
  createLogger,
  dispatch,
  geocodeAddress,
  IntegrationNotConfiguredError,
  type DeliveryProviderId,
} from "@guma-commerce/services";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const log = createLogger("orders:book-delivery");

function bookingAllowList(
  preferred: "lalamove" | "grab" | "manual" | undefined
): DeliveryProviderId[] {
  if (preferred === "grab") return ["grab", "lalamove", "manual"];
  if (preferred === "manual") return ["manual"];
  return ["lalamove", "grab", "manual"];
}

/** Books the best available courier (preferred app → failover → manual). */
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
    const delivery = tenantSettings?.settings?.delivery;
    const preferred = delivery?.provider ?? "lalamove";
    const pickupAddress = delivery?.pickupAddress?.trim() ?? "";
    const flatFee = Number(delivery?.flatRate ?? 0) || 0;

    if (preferred !== "manual" && !pickupAddress) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Set your store pickup address first (Settings → Delivery & Shipping).",
        },
        { status: 400 }
      );
    }

    const pickupForGeocode = pickupAddress || order.dropoffAddress;
    const [pickup, dropoff] = await Promise.all([
      geocodeAddress(pickupForGeocode),
      geocodeAddress(order.dropoffAddress),
    ]);
    if (!dropoff || (preferred !== "manual" && !pickup)) {
      return NextResponse.json(
        { ok: false, error: "Could not locate the pickup or delivery address on the map." },
        { status: 400 }
      );
    }

    const owner = await getTenantOwnerContact(session.tenantId);
    const senderPhone =
      tenantSettings?.settings?.whatsapp?.phone?.trim() || owner.phone || undefined;

    const result = await dispatch(
      {
        request: {
          pickup: {
            address: pickupAddress || `Store · ${session.tenantName}`,
            coordinates: pickup
              ? { lat: String(pickup.lat), lng: String(pickup.lng) }
              : undefined,
          },
          dropoff: {
            address: order.dropoffAddress,
            coordinates: { lat: String(dropoff.lat), lng: String(dropoff.lng) },
          },
        },
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        senderName: session.tenantName,
        senderPhone,
        remarks: [order.orderNumber, order.dropoffNotes].filter(Boolean).join(" · "),
      },
      {
        allow: bookingAllowList(preferred),
        manualFlatFee: flatFee,
      }
    );

    const provider =
      result.booking.provider === "bayango" ? "manual" : result.booking.provider;
    if (provider !== "lalamove" && provider !== "grab" && provider !== "manual") {
      return NextResponse.json(
        { ok: false, error: "Unsupported delivery provider." },
        { status: 502 }
      );
    }

    const quoteRowId = await recordDeliveryQuote({
      tenantId: session.tenantId,
      orderId: order.orderId,
      provider,
      quoteId: result.quote.quoteRef,
      fee: result.quote.fee.toFixed(2),
      etaMinutes: result.quote.etaMinutes,
      expiresAt: result.quote.expiresAt ? new Date(result.quote.expiresAt) : undefined,
      rawResponseJson: {
        meta: result.quote.meta,
        failedOver: result.failedOver,
      },
    });

    await createDeliveryBooking({
      orderId: order.orderId,
      quoteId: quoteRowId,
      provider,
      providerOrderId: result.booking.providerOrderId,
      status: result.booking.status,
      trackingUrl: result.booking.trackingUrl,
    });

    return NextResponse.json({
      ok: true,
      delivery: {
        provider,
        providerOrderId: result.booking.providerOrderId,
        status: result.booking.status,
        trackingUrl: result.booking.trackingUrl ?? null,
        fee: result.quote.fee,
        failedOver: result.failedOver,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid order id." }, { status: 400 });
    }
    if (error instanceof IntegrationNotConfiguredError) {
      log.error("Rider booking blocked — integration not configured", error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          integration: error.integration,
          code: "integration_not_configured",
        },
        { status: 503 }
      );
    }
    log.error("Rider booking failed", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not book a rider right now. Try again shortly.",
      },
      { status: 502 }
    );
  }
}
