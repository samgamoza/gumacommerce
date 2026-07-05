import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOrderForTenant,
  deletePushSubscriptions,
  getTenantStorefrontBySlug,
  listPushSubscriptionsForTenant,
  OrderError,
  recordDeliveryQuote,
  recordPaymentIntent,
} from "@guma-commerce/db";
import {
  clientIpFrom,
  createPayMongoClient,
  createSemaphoreClient,
  formatPhp,
  generateOrderNumber,
  isPushConfigured,
  rateLimit,
  sendPushNotifications,
  type PayMongoMethod,
} from "@guma-commerce/services";
import { getTenant as getDemoTenant } from "@/lib/demo-data";
import { getLalamoveCheckoutQuote } from "@/lib/delivery-quote";
import {
  computeDeliveryFee,
  resolveStorefrontSettings,
} from "@/lib/storefront-settings";

const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;

const checkoutSchema = z.object({
  tenantSlug: z.string().min(1).max(64),
  paymentMethod: z.enum(["gcash", "paymaya", "qrph", "cod", "card"]),
  fulfillment: z.enum(["delivery", "pickup"]).default("delivery"),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(PH_MOBILE, "Enter a valid PH mobile number (09XX XXX XXXX).")),
  }),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Your cart is empty.")
    .max(50),
});

function trackingUrl(tenantSlug: string, orderNumber: string): string {
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";
  return `${base}/${tenantSlug}/orders/${orderNumber}`;
}

/** COD orders skip the payment webhook, so notify the seller right away. */
async function pushSellerNewCodOrder(
  tenantId: string,
  orderNumber: string,
  total: string
): Promise<void> {
  if (!isPushConfigured()) return;
  const subscriptions = await listPushSubscriptionsForTenant(tenantId);
  if (subscriptions.length === 0) return;

  const { expiredEndpoints } = await sendPushNotifications(subscriptions, {
    title: "New COD order 🛵",
    body: `Order ${orderNumber} · ${formatPhp(Number(total))} — cash on delivery. Tap to accept it.`,
    url: "/orders",
    tag: `order-${orderNumber}`,
  });
  if (expiredEndpoints.length > 0) {
    await deletePushSubscriptions(expiredEndpoints);
  }
}

export async function POST(request: Request) {
  const limited = await rateLimit(`checkout:${clientIpFrom(request)}`, {
    limit: 10,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body: z.infer<typeof checkoutSchema>;
  try {
    body = checkoutSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message ?? "Invalid checkout data."
        : "Invalid checkout data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (body.fulfillment === "delivery" && (body.address?.length ?? 0) < 10) {
    return NextResponse.json(
      { error: "Please enter your complete delivery address." },
      { status: 400 }
    );
  }

  try {
    // Demo shops: simulate the flow without touching the database.
    const demo = getDemoTenant(body.tenantSlug);
    if (demo) {
      const orderNumber = generateOrderNumber("DMO");
      return NextResponse.json({
        orderNumber,
        status: body.paymentMethod === "cod" ? "accepted" : "pending_payment",
        paymentMethod: body.paymentMethod,
        demo: true,
      });
    }

    const tenant = await getTenantStorefrontBySlug(body.tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const settings = resolveStorefrontSettings(tenant.settingsJson, tenant.currency);
    if (body.paymentMethod === "cod" && !settings.codEnabled) {
      return NextResponse.json(
        { error: "Cash on Delivery is not available for this shop." },
        { status: 400 }
      );
    }
    if (body.fulfillment === "pickup" && !settings.delivery.pickupEnabled) {
      return NextResponse.json(
        { error: "Store pickup is not available for this shop." },
        { status: 400 }
      );
    }

    // Delivery fee is recomputed from a server-side subtotal estimate; unit
    // prices inside createOrderForTenant always come from the database.
    const priceById = new Map(tenant.products.map((p) => [p.id, Number(p.basePrice)]));
    const estimatedSubtotal = body.items.reduce(
      (sum, item) => sum + (priceById.get(item.productId) ?? 0) * item.qty,
      0
    );

    // Lalamove shops get a live distance-based quote; anything else (or any
    // quote failure) falls back to the seller's flat-rate rules.
    const liveQuote =
      body.fulfillment === "delivery" && body.address
        ? await getLalamoveCheckoutQuote(settings, body.address)
        : null;
    const deliveryFee =
      body.fulfillment === "pickup"
        ? 0
        : liveQuote?.fee ?? computeDeliveryFee(estimatedSubtotal, settings);

    const order = await createOrderForTenant({
      tenantSlug: body.tenantSlug,
      items: body.items.map((item) => ({ productId: item.productId, quantity: item.qty })),
      customer: body.customer,
      deliveryType: body.fulfillment,
      deliveryAddress:
        body.fulfillment === "delivery" && body.address
          ? { line1: body.address, notes: body.notes }
          : undefined,
      paymentMethod: body.paymentMethod,
      deliveryFee,
      minOrderAmount: settings.minOrderAmount,
      notes: body.notes,
      sourceChannel: "storefront",
    });

    if (liveQuote) {
      // Persist the quote so the seller can book the same rate from Orders.
      await recordDeliveryQuote({
        tenantId: order.tenantId,
        orderId: order.id,
        provider: "lalamove",
        quoteId: liveQuote.quotationId,
        fee: liveQuote.fee.toFixed(2),
        etaMinutes: liveQuote.etaMinutes,
        rawResponseJson: { stopIds: liveQuote.stopIds, dropoffAddress: body.address },
      }).catch((error) => console.error("[checkout] Failed to record quote:", error));
    }

    const sms = createSemaphoreClient();

    if (body.paymentMethod === "cod") {
      await sms
        .orderConfirmation({
          to: body.customer.phone,
          orderNumber: order.orderNumber,
          total: formatPhp(Number(order.total)),
          trackingUrl: trackingUrl(body.tenantSlug, order.orderNumber),
        })
        .catch((error) => console.error("[checkout] SMS failed:", error));

      await pushSellerNewCodOrder(order.tenantId, order.orderNumber, order.total).catch(
        (error) => console.error("[checkout] Seller push failed:", error)
      );

      return NextResponse.json({
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: "cod",
      });
    }

    const paymongo = createPayMongoClient();
    const intent = await paymongo.createPaymentIntent({
      amountCentavos: order.totalCentavos,
      description: `Order ${order.orderNumber} — ${tenant.name}`,
      methods: [body.paymentMethod as PayMongoMethod],
      metadata: { order_number: order.orderNumber, tenant: body.tenantSlug },
    });

    await recordPaymentIntent({
      orderId: order.id,
      tenantId: order.tenantId,
      gatewayIntentId: intent.id,
      amount: order.total,
      methodType: body.paymentMethod,
    });

    const attached = await paymongo.attachPaymentMethod(
      intent.id,
      body.paymentMethod as PayMongoMethod,
      intent.clientKey
    );

    await sms
      .orderConfirmation({
        to: body.customer.phone,
        orderNumber: order.orderNumber,
        total: formatPhp(Number(order.total)),
        trackingUrl: trackingUrl(body.tenantSlug, order.orderNumber),
      })
      .catch((error) => console.error("[checkout] SMS failed:", error));

    return NextResponse.json({
      orderNumber: order.orderNumber,
      paymentIntentId: intent.id,
      redirectUrl: attached.redirectUrl,
      status: order.status,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
