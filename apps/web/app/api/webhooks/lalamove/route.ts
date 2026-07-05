import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  advanceOrderStatusFromDelivery,
  updateDeliveryByProviderOrderId,
} from "@guma-commerce/db";
import { createLogger } from "@guma-commerce/services";

const log = createLogger("webhook:lalamove");

/**
 * Lalamove partner webhook. Configure the same secret in the Lalamove
 * developer console and LALAMOVE_WEBHOOK_SECRET.
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

function verifySignature(rawBody: string, body: LalamoveWebhookBody, secret: string): boolean {
  // Lalamove signs webhooks as HMAC-SHA256 over `${timestamp}\r\n${rawBody}`.
  const timestamp = body.timestamp;
  const signature = body.signature;
  if (!timestamp || !signature) return false;

  const signed = `${timestamp}\r\n${rawBody}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(String(signature));
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
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
  if (!verifySignature(rawBody, body, secret)) {
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
