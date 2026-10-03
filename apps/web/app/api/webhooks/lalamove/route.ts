import { NextResponse } from "next/server";
import {
  advanceOrderStatusFromDelivery,
  updateDeliveryByProviderOrderId,
} from "@gumakart/db";
import { createLogger, verifyLalamoveWebhook } from "@gumakart/services";

const log = createLogger("webhook:lalamove");

/**
 * Lalamove partner webhook. Signed with the Lalamove API secret
 * (LALAMOVE_WEBHOOK_SECRET, falling back to LALAMOVE_API_SECRET) — see
 * packages/services/src/delivery/lalamove-webhook.ts for the format.
 *
 * Handles ORDER_STATUS_CHANGED (advances our order), DRIVER_ASSIGNED
 * (driver name/phone/plate) and DRIVER_LOCATION pings (live tracking).
 */

interface LalamoveWebhookBody {
  apiKey?: string;
  timestamp?: number | string;
  signature?: string;
  eventType?: string;
  data?: {
    order?: {
      orderId?: string;
      status?: string;
      shareLink?: string;
      driverId?: string;
    };
    driver?: {
      name?: string;
      phone?: string;
      plateNumber?: string;
      location?: { lat?: string | number; lng?: string | number };
      coordinates?: { lat?: string | number; lng?: string | number };
    };
    updatedAt?: string;
  };
}

// Courier statuses that map onto our order lifecycle.
const STATUS_TO_ORDER: Record<string, "out_for_delivery" | "delivered"> = {
  PICKED_UP: "out_for_delivery",
  ON_GOING: "out_for_delivery",
  COMPLETED: "delivered",
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  let body: LalamoveWebhookBody;
  try {
    body = JSON.parse(rawBody) as LalamoveWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secret = process.env.LALAMOVE_WEBHOOK_SECRET ?? process.env.LALAMOVE_API_SECRET ?? "";
  if (!secret) {
    log.error("LALAMOVE_WEBHOOK_SECRET not configured; rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  // The path Lalamove signs is the one registered in their console; override
  // with LALAMOVE_WEBHOOK_PATH if a proxy rewrites it.
  const path = process.env.LALAMOVE_WEBHOOK_PATH?.trim() || new URL(request.url).pathname;
  const valid = verifyLalamoveWebhook({
    payload: body,
    path,
    secret,
    expectedApiKey: process.env.LALAMOVE_API_KEY?.trim() || undefined,
  });
  if (!valid) {
    log.warn("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const providerOrderId = body.data?.order?.orderId;
  if (!providerOrderId) {
    return NextResponse.json({ received: true });
  }

  const courierStatus = body.data?.order?.status?.toUpperCase();
  const driver = body.data?.driver;
  const location = driver?.location ?? driver?.coordinates;

  try {
    const linked = await updateDeliveryByProviderOrderId(providerOrderId, {
      status: courierStatus,
      driverName: driver?.name,
      driverPhone: driver?.phone,
      driverPlateNumber: driver?.plateNumber,
      driverLat: location?.lat !== undefined ? String(location.lat) : undefined,
      driverLng: location?.lng !== undefined ? String(location.lng) : undefined,
      pickedUp: courierStatus === "PICKED_UP",
      delivered: courierStatus === "COMPLETED",
    });

    if (!linked) {
      log.warn("Webhook for unknown Lalamove order", { providerOrderId });
      return NextResponse.json({ received: true });
    }

    const nextOrderStatus = courierStatus ? STATUS_TO_ORDER[courierStatus] : undefined;
    if (nextOrderStatus) {
      await advanceOrderStatusFromDelivery(
        linked.orderId,
        nextOrderStatus,
        nextOrderStatus === "delivered"
          ? "Delivered by Lalamove rider"
          : "Rider picked up your order"
      );
    } else if (courierStatus === "CANCELED" || courierStatus === "REJECTED") {
      // Courier cancellation is not an order cancellation — the seller can
      // rebook. Recorded on the deliveries row above; nothing else to do.
      log.info("Lalamove delivery cancelled", { providerOrderId, orderId: linked.orderId });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("Lalamove webhook processing failed", error, { providerOrderId });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
