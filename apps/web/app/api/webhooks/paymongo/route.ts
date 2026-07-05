import { NextResponse } from "next/server";
import { markOrderPaidByIntent, markPaymentFailedByIntent } from "@guma-commerce/db";
import { createPayMongoClient } from "@guma-commerce/services";

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
        console.warn("[PayMongo Webhook] No matching payment for intent", intentId);
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
