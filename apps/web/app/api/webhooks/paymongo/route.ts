import { NextResponse } from "next/server";
import { createPayMongoClient } from "@guma-commerce/services";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("paymongo-signature") ?? "";
  const paymongo = createPayMongoClient();
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET ?? "";

  if (!paymongo.verifyWebhookSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(payload) as {
    data: { attributes: { type: string; data: unknown } };
  };

  const eventType = event.data.attributes.type;
  console.info("[PayMongo Webhook]", eventType);

  // TODO: Update order payment status in database
  // payment.paid -> mark order as paid, notify seller
  // payment.failed -> notify customer

  return NextResponse.json({ received: true });
}
