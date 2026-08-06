import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOrderForTenant,
  deletePushSubscriptions,
  getTenantStorefrontBySlug,
  isPaymentMethodEnabled,
  listPushSubscriptionsForTenant,
  markCheckoutSessionConverted,
  OrderError,
  recordDeliveryQuote,
  recordManualPaymentIntent,
  recordPaymentIntent,
  resolveTenantPaymentsSettings,
  upsertCheckoutSession,
} from "@guma-commerce/db";
import {
  buildManualEwalletInstructions,
  clientIpFrom,
  createSemaphoreClient,
  formatPhp,
  generateOrderNumber,
  IntegrationNotConfiguredError,
  isPushConfigured,
  logIntegrationStatusOnce,
  rateLimit,
  resolvePaymentAdapterId,
  resolvePaymentsMode,
  sendPushNotifications,
  startOnlinePayment,
  type CheckoutPaymentMethod,
} from "@guma-commerce/services";
import { getTenant as getDemoTenant } from "@/lib/demo-data";
import { getCheckoutDeliveryQuote } from "@/lib/delivery-quote";
import {
  computeDeliveryFee,
  resolveStorefrontSettings,
} from "@/lib/storefront-settings";

const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;

const checkoutSchema = z.object({
  tenantSlug: z.string().min(1).max(64),
  paymentMethod: z.enum(["gcash", "paymaya", "qrph", "cod", "card", "bank"]),
  fulfillment: z.enum(["delivery", "pickup"]).default("delivery"),
  sessionKey: z.string().min(8).max(64).optional(),
  couponCode: z.string().trim().max(64).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(PH_MOBILE, "Enter a valid PH mobile number (09XX XXX XXXX).")),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
  }),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(120).optional(),
  barangay: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
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
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";
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

async function emitOrderEvents(input: {
  tenantId: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  total: string;
  succeeded: boolean;
}) {
  try {
    const { ensureEventsWired } = await import("@/lib/events-bootstrap");
    ensureEventsWired();
    const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
    await emitDomainEvent({
      name: EVENT_NAMES.ORDER_CREATED,
      data: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        paymentMethod: input.paymentMethod,
        total: input.total,
      },
      idempotencyKey: `Order.Created.V1:${input.orderId}`,
    });
    if (input.succeeded) {
      await emitDomainEvent({
        name: EVENT_NAMES.ORDER_SUCCEEDED,
        data: {
          tenantId: input.tenantId,
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          paymentMethod: input.paymentMethod,
          total: input.total,
          channel: input.paymentMethod === "cod" ? "cod" : "online",
        },
        idempotencyKey: `Order.Succeeded.V1:${input.orderId}`,
      });
    }
  } catch (error) {
    console.error("[checkout] event emit failed:", error);
  }
}

export async function POST(request: Request) {
  logIntegrationStatusOnce();

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

    const settings = resolveStorefrontSettings(
      tenant.settingsJson,
      tenant.currency,
      tenant.checkoutPublishedJson,
      tenant.shippingPublishedJson
    );
    const checkoutConfig = settings.checkout;

    if (!isPaymentMethodEnabled(checkoutConfig, body.paymentMethod)) {
      return NextResponse.json(
        { error: "That payment method is not available for this shop." },
        { status: 400 }
      );
    }
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
    if (checkoutConfig.customer?.requireEmail && !body.customer.email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (
      body.fulfillment === "delivery" &&
      checkoutConfig.customer?.requireStructuredAddress &&
      (!(body.city?.trim()) || !(body.barangay?.trim()))
    ) {
      return NextResponse.json(
        { error: "Please enter your city and barangay." },
        { status: 400 }
      );
    }

    if (body.sessionKey) {
      await upsertCheckoutSession({
        tenantId: tenant.id,
        sessionKey: body.sessionKey,
        cartJson: body.items,
        customerJson: body.customer,
        addressJson: {
          line1: body.address,
          city: body.city,
          barangay: body.barangay,
          postalCode: body.postalCode,
        },
        couponCode: body.couponCode ?? null,
      }).catch((error) => console.error("[checkout] session upsert failed:", error));
    }

    const priceById = new Map(tenant.products.map((p) => [p.id, Number(p.basePrice)]));
    const estimatedSubtotal = body.items.reduce(
      (sum, item) => sum + (priceById.get(item.productId) ?? 0) * item.qty,
      0
    );

    const liveQuote =
      body.fulfillment === "delivery" && body.address
        ? await getCheckoutDeliveryQuote(settings, body.address)
        : null;
    const deliveryFee =
      body.fulfillment === "pickup"
        ? 0
        : liveQuote?.fee ??
          computeDeliveryFee(estimatedSubtotal, settings, {
            city: body.city,
            barangay: body.barangay,
            postalCode: body.postalCode,
          });

    const order = await createOrderForTenant({
      tenantSlug: body.tenantSlug,
      items: body.items.map((item) => ({ productId: item.productId, quantity: item.qty })),
      customer: {
        name: body.customer.name,
        phone: body.customer.phone,
        email: body.customer.email || undefined,
      },
      deliveryType: body.fulfillment,
      deliveryAddress:
        body.fulfillment === "delivery" && body.address
          ? {
              line1: body.address,
              city: body.city,
              barangay: body.barangay,
              postalCode: body.postalCode,
              notes: body.notes,
            }
          : undefined,
      paymentMethod: body.paymentMethod,
      deliveryFee,
      minOrderAmount: settings.minOrderAmount,
      checkoutConfig,
      couponCode: body.couponCode,
      notes: body.notes,
      sourceChannel: "storefront",
    });

    if (body.sessionKey) {
      await markCheckoutSessionConverted({
        tenantId: order.tenantId,
        sessionKey: body.sessionKey,
        orderId: order.id,
      }).catch((error) => console.error("[checkout] session convert failed:", error));
    }

    if (liveQuote) {
      await recordDeliveryQuote({
        tenantId: order.tenantId,
        orderId: order.id,
        provider: liveQuote.provider,
        quoteId: liveQuote.quotationId,
        fee: liveQuote.fee.toFixed(2),
        etaMinutes: liveQuote.etaMinutes,
        rawResponseJson: { meta: liveQuote.meta, dropoffAddress: body.address },
      }).catch((error) => console.error("[checkout] Failed to record quote:", error));
    }

    const sms = createSemaphoreClient();
    const paymentsSettings = resolveTenantPaymentsSettings(
      tenant.settingsJson as Record<string, unknown>
    );
    const paymentsMode = resolvePaymentsMode({ settingsMode: paymentsSettings.mode });
    const adapter = resolvePaymentAdapterId(
      body.paymentMethod as CheckoutPaymentMethod,
      paymentsMode
    );

    await emitOrderEvents({
      tenantId: order.tenantId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: body.paymentMethod,
      total: order.total,
      succeeded: adapter === "cod",
    });

    if (adapter === "cod") {
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
        adapter: "cod",
        totals: {
          subtotal: order.subtotal,
          discount: order.discount,
          tax: order.tax,
          deliveryFee: order.deliveryFee,
          total: order.total,
        },
      });
    }

    if (adapter === "manual_ewallet") {
      const method =
        body.paymentMethod === "paymaya"
          ? "paymaya"
          : body.paymentMethod === "bank"
            ? "bank"
            : "gcash";

      await recordManualPaymentIntent({
        orderId: order.id,
        tenantId: order.tenantId,
        amount: order.total,
        methodType: method,
        orderNumber: order.orderNumber,
      });

      const payInstructions = buildManualEwalletInstructions({
        method,
        amount: formatPhp(Number(order.total)),
        orderNumber: order.orderNumber,
        receiving: paymentsSettings.receiving,
      });

      await sms
        .orderConfirmation({
          to: body.customer.phone,
          orderNumber: order.orderNumber,
          total: formatPhp(Number(order.total)),
          trackingUrl: trackingUrl(body.tenantSlug, order.orderNumber),
        })
        .catch((error) => console.error("[checkout] SMS failed:", error));

      await pushSellerNewCodOrder(order.tenantId, order.orderNumber, order.total).catch(
        (error) => console.error("[checkout] Seller push (manual pay) failed:", error)
      );

      return NextResponse.json({
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: method,
        adapter: "manual_ewallet",
        payInstructions,
        totals: {
          subtotal: order.subtotal,
          discount: order.discount,
          tax: order.tax,
          deliveryFee: order.deliveryFee,
          total: order.total,
        },
      });
    }

    if (body.paymentMethod === "bank") {
      return NextResponse.json(
        { error: "Bank transfer requires manual e-wallet mode." },
        { status: 400 }
      );
    }

    const started = await startOnlinePayment({
      amountCentavos: order.totalCentavos,
      description: `Order ${order.orderNumber} — ${tenant.name}`,
      method: body.paymentMethod as Exclude<CheckoutPaymentMethod, "cod" | "bank">,
      metadata: { order_number: order.orderNumber, tenant: body.tenantSlug },
    });

    await recordPaymentIntent({
      orderId: order.id,
      tenantId: order.tenantId,
      gatewayIntentId: started.paymentIntentId,
      amount: order.total,
      methodType: body.paymentMethod,
    });

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
      paymentIntentId: started.paymentIntentId,
      redirectUrl: started.redirectUrl,
      status: order.status,
      adapter: started.adapter,
      totals: {
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        deliveryFee: order.deliveryFee,
        total: order.total,
      },
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof IntegrationNotConfiguredError) {
      console.error("[checkout] Integration not configured:", error.message);
      return NextResponse.json(
        {
          error: error.message,
          integration: error.integration,
          code: "integration_not_configured",
        },
        { status: 503 }
      );
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
