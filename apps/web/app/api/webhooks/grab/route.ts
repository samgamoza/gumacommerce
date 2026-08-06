import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  advanceOrderStatusFromDelivery,
  updateDeliveryByProviderOrderId,
} from "@guma-commerce/db";
import { createLogger } from "@guma-commerce/services";

const log = createLogger("webhook:grab");

/**
 * GrabExpress partner webhook.
 * Set GRAB_WEBHOOK_SECRET and register `{WEB}/api/webhooks/grab`.
 *
 * Payload shape varies by partner program — we accept the common deliveryID/status
 * fields used by the GrabAdapter parser, plus a few aliases.
 */

interface GrabWebhookBody {
  deliveryID?: string;
  deliveryId?: string;
  id?: string;
  status?: string;
  trackingURL?: string;
  trackingUrl?: string;
  driver?: {
    name?: string;
    phone?: string;
    plateNumber?: string;
    vehiclePlateNumber?: string;
  };
  signature?: string;
  timestamp?: string | number;
}

function verifyOptionalSignature(rawBody: string, body: GrabWebhookBody, secret: string): boolean {
  if (!secret) return true;
  const signature = body.signature ?? "";
  const timestamp = body.timestamp;
  if (!signature || timestamp === undefined) return false;
  const signed = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(String(signature));
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

const STATUS_TO_ORDER: Record<string, "out_for_delivery" | "delivered"> = {
  PICKING_UP: "out_for_delivery",
  IN_DELIVERY: "out_for_delivery",
  COLLECTED: "out_for_delivery",
  IN_PROGRESS: "out_for_delivery",
  COMPLETED: "delivered",
  DELIVERED: "delivered",
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  let body: GrabWebhookBody;
  try {
    body = JSON.parse(rawBody) as GrabWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secret = process.env.GRAB_WEBHOOK_SECRET?.trim() ?? "";
  if (secret && !verifyOptionalSignature(rawBody, body, secret)) {
    log.warn("Invalid Grab webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const providerOrderId = body.deliveryID ?? body.deliveryId ?? body.id;
  if (!providerOrderId) {
    return NextResponse.json({ received: true });
  }

  const courierStatus = body.status?.toUpperCase();
  const driver = body.driver;

  try {
    const linked = await updateDeliveryByProviderOrderId(providerOrderId, {
      status: courierStatus,
      driverName: driver?.name,
      driverPhone: driver?.phone,
      driverPlateNumber: driver?.plateNumber ?? driver?.vehiclePlateNumber,
      pickedUp: Boolean(
        courierStatus && ["PICKING_UP", "IN_DELIVERY", "COLLECTED", "IN_PROGRESS"].includes(courierStatus)
      ),
      delivered: courierStatus === "COMPLETED" || courierStatus === "DELIVERED",
    });

    if (!linked) {
      log.warn("Webhook for unknown Grab delivery", { providerOrderId });
      return NextResponse.json({ received: true });
    }

    if (body.trackingURL || body.trackingUrl) {
      await updateDeliveryByProviderOrderId(providerOrderId, {
        status: courierStatus,
      });
    }

    const nextOrderStatus = courierStatus ? STATUS_TO_ORDER[courierStatus] : undefined;
    if (nextOrderStatus) {
      await advanceOrderStatusFromDelivery(
        linked.orderId,
        nextOrderStatus,
        nextOrderStatus === "delivered"
          ? "Delivered by GrabExpress rider"
          : "GrabExpress rider is on the way"
      );
    } else if (courierStatus === "CANCELED" || courierStatus === "CANCELLED" || courierStatus === "FAILED") {
      log.info("Grab delivery cancelled", { providerOrderId, orderId: linked.orderId });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("Grab webhook processing failed", error, { providerOrderId });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
