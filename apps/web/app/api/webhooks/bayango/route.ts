import { NextResponse } from "next/server";
import {
  advanceOrderStatusFromDelivery,
  updateDeliveryByProviderOrderId,
} from "@gumakart/db";
import {
  BAYANGO_ATTENTION_STATUSES,
  BAYANGO_STATUS_TO_ORDER,
  createLogger,
  parseBayanGoWebhook,
  verifyBayanGoWebhook,
} from "@gumakart/services";

const log = createLogger("webhook:bayango");

/**
 * BayanGo Partner API webhook (docs/BAYANGO-PARTNER-API-CONTRACT.md §3).
 *
 * Signed with HMAC-SHA256 over `${X-BayanGo-Timestamp}.${rawBody}` using
 * BAYANGO_WEBHOOK_SECRET; requests older than 5 minutes are rejected. Without a
 * secret we refuse everything — an unauthenticated courier webhook can move
 * orders to "delivered".
 *
 * Replays are harmless: delivery fields are overwritten with the same values and
 * order status only ever moves forward. (Per-event dedupe by X-BayanGo-Event-Id
 * lands with the inbox/outbox table in Phase 2.)
 */
export async function POST(request: Request) {
  const secret = process.env.BAYANGO_WEBHOOK_SECRET ?? "";
  if (!secret.trim()) {
    log.error("BAYANGO_WEBHOOK_SECRET not configured; rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const valid = verifyBayanGoWebhook({
    rawBody,
    signature: request.headers.get("x-bayango-signature"),
    timestamp: request.headers.get("x-bayango-timestamp"),
    secret,
  });
  if (!valid) {
    log.warn("Invalid or stale BayanGo webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parseBayanGoWebhook(payload);
  if (!event) {
    // Signed but not in the contract shape — acknowledge so BayanGo stops
    // retrying, and log loudly so the mismatch gets fixed.
    log.error("BayanGo webhook did not match contract", {
      eventId: request.headers.get("x-bayango-event-id"),
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  const { delivery } = event;
  const status = delivery.status;

  try {
    const linked = await updateDeliveryByProviderOrderId(delivery.deliveryId, {
      status,
      driverName: delivery.rider?.name,
      driverPhone: delivery.rider?.phone,
      driverPlateNumber: delivery.rider?.plateNumber,
      driverLat: delivery.location ? String(delivery.location.lat) : undefined,
      driverLng: delivery.location ? String(delivery.location.lng) : undefined,
      trackingUrl: delivery.trackingUrl,
      pickedUp: status === "picked_up",
      delivered: status === "delivered",
    });

    if (!linked) {
      log.warn("Webhook for unknown BayanGo delivery", {
        deliveryId: delivery.deliveryId,
        externalRef: delivery.externalRef,
      });
      return NextResponse.json({ received: true });
    }

    if (delivery.externalRef && delivery.externalRef !== linked.orderId) {
      // Contract says externalRef is our order id. A mismatch means a mixed-up
      // booking — record it, but trust our own deliveries row.
      log.error("BayanGo externalRef does not match linked order", {
        deliveryId: delivery.deliveryId,
        externalRef: delivery.externalRef,
        orderId: linked.orderId,
      });
    }

    if (event.type === "delivery.status_changed") {
      const nextOrderStatus = BAYANGO_STATUS_TO_ORDER[status];
      if (nextOrderStatus) {
        await advanceOrderStatusFromDelivery(
          linked.orderId,
          nextOrderStatus,
          nextOrderStatus === "delivered"
            ? "Delivered by BayanGo rider"
            : "BayanGo rider has your order"
        );
      } else if (BAYANGO_ATTENTION_STATUSES.includes(status)) {
        // Not an order cancellation — the seller decides (rebook / refund).
        // Surfaced as "needs attention" once Phase 2 adds fulfillment status.
        log.warn("BayanGo delivery needs merchant attention", {
          deliveryId: delivery.deliveryId,
          orderId: linked.orderId,
          status,
          failureReason: delivery.failureReason,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("BayanGo webhook processing failed", error, {
      deliveryId: delivery.deliveryId,
    });
    // 500 → BayanGo retries with backoff.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
