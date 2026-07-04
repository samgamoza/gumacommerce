import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPayMongoClient,
  createSemaphoreClient,
  formatPhp,
  generateOrderNumber,
} from "@guma-commerce/services";

const checkoutSchema = z.object({
  tenantSlug: z.string(),
  paymentMethod: z.enum(["gcash", "paymaya", "qrph", "cod", "card"]),
  amount: z.number().positive(),
  customer: z.object({
    name: z.string(),
    phone: z.string(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = checkoutSchema.parse(await request.json());
    const orderNumber = generateOrderNumber(body.tenantSlug.slice(0, 3));
    const amountCentavos = Math.round(body.amount * 100);

    if (body.paymentMethod === "cod") {
      const sms = createSemaphoreClient();
      await sms.orderConfirmation({
        to: body.customer.phone,
        orderNumber,
        total: formatPhp(body.amount),
      });

      return NextResponse.json({
        orderNumber,
        status: "paid",
        paymentMethod: "cod",
      });
    }

    const paymongo = createPayMongoClient();
    const intent = await paymongo.createPaymentIntent({
      amountCentavos,
      description: `Order ${orderNumber}`,
      methods: [body.paymentMethod],
      metadata: { order_number: orderNumber, tenant: body.tenantSlug },
    });

    const methodMap = {
      gcash: "gcash" as const,
      paymaya: "paymaya" as const,
      qrph: "qrph" as const,
      card: "card" as const,
    };

    const attached = await paymongo.attachPaymentMethod(
      intent.id,
      methodMap[body.paymentMethod as keyof typeof methodMap] ?? "gcash",
      intent.clientKey
    );

    const sms = createSemaphoreClient();
    await sms.orderConfirmation({
      to: body.customer.phone,
      orderNumber,
      total: formatPhp(body.amount),
      trackingUrl: `${process.env.NEXT_PUBLIC_STOREFRONT_URL}/${body.tenantSlug}/orders/${orderNumber}`,
    });

    return NextResponse.json({
      orderNumber,
      paymentIntentId: intent.id,
      redirectUrl: attached.redirectUrl,
      status: attached.status,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 400 });
  }
}
