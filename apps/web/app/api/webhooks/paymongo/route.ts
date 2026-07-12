import { NextResponse } from "next/server";
import {
  deletePushSubscriptions,
  getTenantOwnerContact,
  getTenantSettings,
  listPushSubscriptionsForTenant,
  markOrderPaidByIntent,
  markPaymentFailedByIntent,
  markPlanPaymentPaidByIntent,
  type MarkOrderPaidResult,
} from "@guma-commerce/db";
import {
  createPayMongoClient,
  createSemaphoreClient,
  formatPhp,
  isPushConfigured,
  sendPushNotifications,
} from "@guma-commerce/services";

/** Browser push to every device the seller enabled notifications on. */
async function pushSellerPaymentReceived(result: MarkOrderPaidResult): Promise<void> {
  if (!result.tenantId || !result.orderNumber || !isPushConfigured()) return;

  const subscriptions = await listPushSubscriptionsForTenant(result.tenantId);
  if (subscriptions.length === 0) return;

  const total = result.total ? formatPhp(Number(result.total)) : "";
  const { expiredEndpoints } = await sendPushNotifications(subscriptions, {
    title: "Payment received 💸",
    body: `Order ${result.orderNumber}${total ? ` · ${total}` : ""} is paid. Tap to start preparing it.`,
    url: "/orders",
    tag: `order-${result.orderNumber}`,
  });
  if (expiredEndpoints.length > 0) {
    await deletePushSubscriptions(expiredEndpoints);
  }
}

/**
 * Texts the seller when a payment lands. Opt-in via the
 * "SMS me for new orders" notification setting; uses the WhatsApp business
 * number when set, otherwise the owner account's phone.
 */
async function notifySellerPaymentReceived(result: MarkOrderPaidResult): Promise<void> {
  if (!result.tenantId || !result.orderNumber) return;

  const settings = await getTenantSettings(result.tenantId);
  if (settings?.settings?.notifications?.smsOnNewOrder !== true) return;

  const owner = await getTenantOwnerContact(result.tenantId);
  const phone = settings.settings.whatsapp?.phone?.trim() || owner.phone;
  if (!phone) return;

  const total = result.total ? formatPhp(Number(result.total)) : "";
  await createSemaphoreClient().send({
    to: phone,
    message: `Guma Commerce: Payment received for order ${result.orderNumber}${
      total ? ` (${total})` : ""
    }. Open your dashboard to start preparing it.`,
    priority: true,
  });
}

interface PayMongoEvent {
  data: {
    attributes: {
      type: string;
      data: {
        id: string;
        attributes: {
          payment_intent_id?: string;
          status?: string;
        };
      };
    };
  };
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("paymongo-signature") ?? "";
  const paymongo = createPayMongoClient();
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET ?? "";

  if (!paymongo.verifyWebhookSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PayMongoEvent;
  try {
    event = JSON.parse(payload) as PayMongoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventType = event.data?.attributes?.type;
  const resource = event.data?.attributes?.data;
  const intentId = resource?.attributes?.payment_intent_id;
  console.info("[PayMongo Webhook]", eventType, intentId ?? "");

  try {
    if (eventType === "payment.paid" && intentId) {
      const result = await markOrderPaidByIntent(intentId, resource.id, event);
      if (!result.ok) {
        // Not an order payment — check plan-upgrade billing.
        const planResult = await markPlanPaymentPaidByIntent(intentId);
        if (planResult.ok && planResult.transitioned) {
          console.info(
            "[PayMongo Webhook] Plan upgraded",
            planResult.tenantId,
            planResult.plan
          );
          if (planResult.tenantId && planResult.plan) {
            const { ensureEventsWired } = await import("@/lib/events-bootstrap");
            ensureEventsWired();
            const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
            await emitDomainEvent({
              name: EVENT_NAMES.MERCHANT_UPGRADED,
              data: {
                tenantId: planResult.tenantId,
                plan: planResult.plan,
              },
              idempotencyKey: `Merchant.Upgraded.V1:${planResult.tenantId}:${intentId}`,
            });
          }
        } else if (!planResult.ok) {
          console.warn("[PayMongo Webhook] No matching payment for intent", intentId);
        }
      } else if (result.transitioned) {
        // Only on the first transition, so webhook retries don't re-notify the seller.
        if (result.tenantId && result.orderNumber) {
          const { ensureEventsWired } = await import("@/lib/events-bootstrap");
          ensureEventsWired();
          const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
          await emitDomainEvent({
            name: EVENT_NAMES.ORDER_PAYMENT_SUCCEEDED,
            data: {
              tenantId: result.tenantId,
              orderNumber: result.orderNumber,
              total: result.total,
              gatewayIntentId: intentId,
            },
            idempotencyKey: `Order.PaymentSucceeded.V1:${intentId}`,
          });
        }
        await Promise.all([
          notifySellerPaymentReceived(result).catch((error) =>
            console.error("[PayMongo Webhook] Seller SMS failed:", error)
          ),
          pushSellerPaymentReceived(result).catch((error) =>
            console.error("[PayMongo Webhook] Seller push failed:", error)
          ),
        ]);
      }
    } else if (eventType === "payment.failed" && intentId) {
      await markPaymentFailedByIntent(intentId);
    }
  } catch (error) {
    console.error("[PayMongo Webhook] Handler error:", error);
    // Return 500 so PayMongo retries the delivery.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
