import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../client";
import {
  creditSaleForOrder,
  releaseOrderSaleCredit,
  reverseSaleCreditForOrder,
} from "./wallet";
import {
  customers,
  deliveries,
  orderItems,
  orderStatusHistory,
  orders,
  paymentTransactions,
  productVariants,
  products,
  tenants,
} from "../schema/index";
import {
  computeCheckoutTotals,
  findActiveCoupon,
  normalizeCheckoutJson,
  type TenantCheckoutJson,
} from "../types/tenant-checkout";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Valid forward transitions a seller (or webhook) can make. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["accepted", "cancelled", "refunded"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "out_for_delivery", "cancelled"],
  ready_for_pickup: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

function toCentavos(value: string | number): number {
  return Math.round(Number(value) * 100);
}

function fromCentavos(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

function orderNumberPrefix(slug: string): string {
  return slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "ORD";
}

export class OrderError extends Error {
  constructor(
    message: string,
    public code:
      | "TENANT_NOT_FOUND"
      | "EMPTY_CART"
      | "PRODUCT_UNAVAILABLE"
      | "OUT_OF_STOCK"
      | "BELOW_MINIMUM"
      | "COUPON_LIMIT_REACHED"
      | "INVALID_TRANSITION"
      | "ORDER_NOT_FOUND"
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  tenantSlug: string;
  items: CreateOrderItemInput[];
  customer: { name: string; phone: string; email?: string };
  deliveryType: "delivery" | "pickup";
  deliveryAddress?: {
    line1: string;
    city?: string;
    barangay?: string;
    postalCode?: string;
    notes?: string;
  };
  paymentMethod: string;
  /** Delivery fee in PHP, already resolved by the caller from tenant settings. */
  deliveryFee: number;
  /** Minimum order amount in PHP; 0 disables the check. */
  minOrderAmount: number;
  /** Published checkout config for tax / coupon / automatic discount. */
  checkoutConfig?: import("../types/tenant-checkout").TenantCheckoutJson | null;
  couponCode?: string | null;
  notes?: string;
  sourceChannel?: string;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  tenantId: string;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  tax: string;
  deliveryFee: string;
  total: string;
  totalCentavos: number;
  couponCode: string | null;
  items: Array<{ title: string; quantity: number; unitPrice: string; lineTotal: string }>;
}

/**
 * Creates an order with server-side pricing: unit prices are always read from
 * the products table, never from the client. Decrements default-variant stock
 * for products that track inventory.
 */
export async function createOrderForTenant(input: CreateOrderInput): Promise<CreatedOrder> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, input.tenantSlug))
    .limit(1);
  if (!tenant || tenant.status !== "active") {
    throw new OrderError("This shop is not accepting orders right now.", "TENANT_NOT_FOUND");
  }

  if (input.items.length === 0) {
    throw new OrderError("Your cart is empty.", "EMPTY_CART");
  }

  const quantities = new Map<string, number>();
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new OrderError("Invalid item quantity.", "PRODUCT_UNAVAILABLE");
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  const productIds = [...quantities.keys()];

  return db.transaction(async (tx) => {
    const catalog = await tx
      .select({
        id: products.id,
        title: products.title,
        status: products.status,
        basePrice: products.basePrice,
        trackInventory: products.trackInventory,
        variantId: productVariants.id,
        variantTitle: productVariants.title,
        stockQty: productVariants.stockQty,
      })
      .from(products)
      .leftJoin(productVariants, eq(productVariants.productId, products.id))
      .where(and(eq(products.tenantId, tenant.id), inArray(products.id, productIds)));

    // one row per product (first/default variant wins)
    const byProduct = new Map<string, (typeof catalog)[number]>();
    for (const row of catalog) {
      if (!byProduct.has(row.id)) byProduct.set(row.id, row);
    }

    let subtotalCentavos = 0;
    const lines: Array<{
      productId: string;
      variantId: string | null;
      title: string;
      variantTitle: string | null;
      quantity: number;
      unitPriceCentavos: number;
    }> = [];

    for (const [productId, quantity] of quantities) {
      const row = byProduct.get(productId);
      if (!row || row.status !== "active") {
        throw new OrderError(
          "One of the items in your cart is no longer available.",
          "PRODUCT_UNAVAILABLE"
        );
      }
      if (row.trackInventory && row.variantId !== null && (row.stockQty ?? 0) < quantity) {
        throw new OrderError(
          `Not enough stock for "${row.title}" (only ${row.stockQty ?? 0} left).`,
          "OUT_OF_STOCK"
        );
      }
      const unitPriceCentavos = toCentavos(row.basePrice);
      subtotalCentavos += unitPriceCentavos * quantity;
      lines.push({
        productId,
        variantId: row.variantId,
        title: row.title,
        variantTitle: row.variantTitle,
        quantity,
        unitPriceCentavos,
      });
    }

    if (input.minOrderAmount > 0 && subtotalCentavos < toCentavos(input.minOrderAmount)) {
      throw new OrderError(
        `Minimum order is ₱${input.minOrderAmount}.`,
        "BELOW_MINIMUM"
      );
    }

    const deliveryFeeCentavos =
      input.deliveryType === "pickup" ? 0 : toCentavos(input.deliveryFee);

    const checkoutConfig: TenantCheckoutJson = normalizeCheckoutJson(
      input.checkoutConfig ?? {
        minOrderAmount: input.minOrderAmount,
      }
    );

    // Enforce the coupon redemption cap (Constitutional review C1). A coupon only
    // "redeems" when it would actually apply (active + subtotal >= minSubtotal), so
    // we only block in that case. Redemptions are counted against prior orders that
    // recorded this coupon code for the tenant, inside this transaction. Note: under
    // READ COMMITTED two checkouts of the same coupon racing within the same instant
    // can each see count = max-1 and both succeed, so the cap is a soft limit with a
    // narrow over-redemption window; a hard guarantee would need a dedicated counter
    // row locked FOR UPDATE (deferred — see review remediation).
    if (input.couponCode) {
      const coupon = findActiveCoupon(checkoutConfig, input.couponCode);
      if (coupon && coupon.maxRedemptions && coupon.maxRedemptions > 0) {
        const wouldApply = subtotalCentavos >= toCentavos(coupon.minSubtotal ?? 0);
        if (wouldApply) {
          const [usage] = await tx
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(and(eq(orders.tenantId, tenant.id), eq(orders.couponCode, coupon.code)));
          if (Number(usage?.count ?? 0) >= coupon.maxRedemptions) {
            throw new OrderError(
              "This coupon has reached its redemption limit.",
              "COUPON_LIMIT_REACHED"
            );
          }
        }
      }
    }

    const totals = computeCheckoutTotals({
      subtotal: subtotalCentavos / 100,
      deliveryFee: deliveryFeeCentavos / 100,
      checkout: checkoutConfig,
      couponCode: input.couponCode,
    });

    const discountCentavos = toCentavos(totals.discount);
    const taxCentavos = toCentavos(totals.tax);
    const totalCentavos = toCentavos(totals.total);

    // COD orders are actionable immediately; online payments wait for the webhook.
    const initialStatus: OrderStatus =
      input.paymentMethod === "cod" ? "accepted" : "pending_payment";

    // Per-tenant sequential order numbers (GMA-0001, GMA-0002, ...), claimed
    // atomically: the UPDATE row-locks the tenant so two concurrent checkouts
    // can't get the same number.
    const [seqRow] = await tx
      .update(tenants)
      .set({ nextOrderSeq: sql`${tenants.nextOrderSeq} + 1` })
      .where(eq(tenants.id, tenant.id))
      .returning({ nextOrderSeq: tenants.nextOrderSeq });
    const claimedSeq = (seqRow?.nextOrderSeq ?? 2) - 1;
    const orderNumber = `${orderNumberPrefix(input.tenantSlug)}-${String(claimedSeq).padStart(4, "0")}`;

    // Upsert the shop-CRM customer by phone (phone is the buyer's identity) and
    // link this order to it, so guest orders roll up into a repeat-buyer record.
    const normalizedPhone = (input.customer.phone ?? "").replace(/[^\d+]/g, "");
    let customerRecordId: string | null = null;
    if (normalizedPhone) {
      const nowTs = new Date();
      const [cust] = await tx
        .insert(customers)
        .values({
          tenantId: tenant.id,
          phone: normalizedPhone,
          name: input.customer.name,
          email: input.customer.email ?? null,
          firstOrderAt: nowTs,
          lastOrderAt: nowTs,
        })
        .onConflictDoUpdate({
          target: [customers.tenantId, customers.phone],
          set: {
            name: sql`coalesce(nullif(excluded.name, ''), ${customers.name})`,
            email: sql`coalesce(nullif(excluded.email, ''), ${customers.email})`,
            lastOrderAt: nowTs,
            updatedAt: nowTs,
          },
        })
        .returning({ id: customers.id });
      customerRecordId = cust?.id ?? null;
    }

    const [order] = await tx
      .insert(orders)
      .values({
        tenantId: tenant.id,
        orderNumber,
        customerRecordId,
        guestName: input.customer.name,
        guestPhone: input.customer.phone,
        guestEmail: input.customer.email,
        status: initialStatus,
        subtotal: fromCentavos(subtotalCentavos),
        discount: fromCentavos(discountCentavos),
        tax: fromCentavos(taxCentavos),
        couponCode: totals.couponCode,
        deliveryFee: fromCentavos(deliveryFeeCentavos),
        total: fromCentavos(totalCentavos),
        paymentStatus: "pending",
        paymentMethod: input.paymentMethod,
        deliveryType: input.deliveryType,
        deliveryAddressJson: input.deliveryAddress ?? null,
        notes: input.notes,
        sourceChannel: input.sourceChannel ?? "storefront",
      })
      .returning();

    if (!order) throw new Error("Failed to create order");

    await tx.insert(orderItems).values(
      lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        variantId: line.variantId,
        titleSnapshot: line.title,
        variantSnapshot: line.variantTitle,
        quantity: line.quantity,
        unitPrice: fromCentavos(line.unitPriceCentavos),
        lineTotal: fromCentavos(line.unitPriceCentavos * line.quantity),
      }))
    );

    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      status: initialStatus,
      note:
        input.paymentMethod === "cod"
          ? "Order placed (Cash on Delivery)"
          : "Order placed, awaiting payment",
    });

    // Decrement stock for tracked products.
    for (const line of lines) {
      const row = byProduct.get(line.productId);
      if (row?.trackInventory && line.variantId) {
        await tx
          .update(productVariants)
          .set({ stockQty: sql`greatest(${productVariants.stockQty} - ${line.quantity}, 0)` })
          .where(eq(productVariants.id, line.variantId));
      }
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tenantId: tenant.id,
      status: order.status as OrderStatus,
      subtotal: order.subtotal,
      discount: order.discount ?? "0.00",
      tax: order.tax ?? "0.00",
      deliveryFee: order.deliveryFee ?? "0.00",
      total: order.total,
      totalCentavos,
      couponCode: totals.couponCode,
      items: lines.map((line) => ({
        title: line.title,
        quantity: line.quantity,
        unitPrice: fromCentavos(line.unitPriceCentavos),
        lineTotal: fromCentavos(line.unitPriceCentavos * line.quantity),
      })),
    };
  });
}

export async function recordPaymentIntent(params: {
  orderId: string;
  tenantId: string;
  gatewayIntentId: string;
  amount: string;
  methodType: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(paymentTransactions).values({
    orderId: params.orderId,
    tenantId: params.tenantId,
    gateway: "paymongo",
    gatewayIntentId: params.gatewayIntentId,
    amount: params.amount,
    status: "pending",
    methodType: params.methodType,
  });
}

export interface MarkOrderPaidResult {
  ok: boolean;
  orderNumber?: string;
  tenantId?: string;
  total?: string;
  /** True when this webhook call transitioned the order to paid (vs a replay). */
  transitioned?: boolean;
}

/** Webhook handler: marks the payment + order paid by PayMongo intent id. Idempotent. */
export async function markOrderPaidByIntent(
  gatewayIntentId: string,
  gatewayPaymentId?: string,
  rawWebhookJson?: unknown
): Promise<MarkOrderPaidResult> {
  const db = getDb();
  const [txn] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.gatewayIntentId, gatewayIntentId))
    .limit(1);
  if (!txn) return { ok: false };

  const now = new Date();
  await db
    .update(paymentTransactions)
    .set({
      status: "paid",
      gatewayPaymentId,
      paidAt: now,
      ...(rawWebhookJson !== undefined ? { rawWebhookJson } : {}),
    })
    .where(eq(paymentTransactions.id, txn.id));

  const [order] = await db.select().from(orders).where(eq(orders.id, txn.orderId)).limit(1);
  if (!order) return { ok: false };

  let transitioned = false;
  if (order.status === "pending_payment") {
    await db
      .update(orders)
      .set({ status: "paid", paymentStatus: "paid", paidAt: now })
      .where(eq(orders.id, order.id));
    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      status: "paid",
      note: "Payment confirmed via PayMongo",
    });
    transitioned = true;
  } else if (order.paymentStatus !== "paid") {
    await db
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: now })
      .where(eq(orders.id, order.id));
    transitioned = true;
  }

  if (transitioned) {
    await creditSaleForOrder(order.id);
  }

  return {
    ok: true,
    orderNumber: order.orderNumber,
    tenantId: order.tenantId,
    total: order.total,
    transitioned,
  };
}

export async function markPaymentFailedByIntent(gatewayIntentId: string): Promise<void> {
  const db = getDb();
  const [txn] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.gatewayIntentId, gatewayIntentId))
    .limit(1);
  if (!txn) return;

  await db
    .update(paymentTransactions)
    .set({ status: "failed" })
    .where(eq(paymentTransactions.id, txn.id));
}

export interface TenantOrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  deliveryType: string;
  total: string;
  itemsSummary: string;
  itemCount: number;
  createdAt: Date;
  paymentReference: string | null;
  paymentProofUrl: string | null;
}

export async function listOrdersForTenant(tenantId: string): Promise<TenantOrderListItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.tenantId, tenantId))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  if (rows.length === 0) return [];

  const items = await db
    .select({
      orderId: orderItems.orderId,
      title: orderItems.titleSnapshot,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((row) => row.id)
      )
    );

  const itemsByOrder = new Map<string, Array<{ title: string; quantity: number }>>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push({ title: item.title, quantity: item.quantity });
    itemsByOrder.set(item.orderId, list);
  }

  const paymentRows = await db
    .select({
      orderId: paymentTransactions.orderId,
      status: paymentTransactions.status,
      rawWebhookJson: paymentTransactions.rawWebhookJson,
    })
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.tenantId, tenantId),
        eq(paymentTransactions.gateway, "manual"),
        inArray(
          paymentTransactions.orderId,
          rows.map((row) => row.id)
        )
      )
    );

  const paymentMetaByOrder = new Map<
    string,
    { reference: string | null; proofUrl: string | null }
  >();
  for (const txn of paymentRows) {
    const raw = (txn.rawWebhookJson ?? {}) as {
      buyerReference?: string;
      proofUrl?: string | null;
    };
    paymentMetaByOrder.set(txn.orderId, {
      reference: raw.buyerReference ?? null,
      proofUrl: raw.proofUrl ?? null,
    });
  }

  return rows.map((row) => {
    const orderItemsList = itemsByOrder.get(row.id) ?? [];
    const payMeta = paymentMetaByOrder.get(row.id);
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.guestName ?? "Customer",
      customerPhone: row.guestPhone ?? "",
      status: row.status as OrderStatus,
      paymentStatus: row.paymentStatus ?? "pending",
      paymentMethod: row.paymentMethod ?? "",
      deliveryType: row.deliveryType ?? "delivery",
      total: row.total,
      itemCount: orderItemsList.reduce((sum, item) => sum + item.quantity, 0),
      itemsSummary: orderItemsList
        .map((item) => `${item.quantity}× ${item.title}`)
        .join(", "),
      createdAt: row.createdAt,
      paymentReference: payMeta?.reference ?? null,
      paymentProofUrl: payMeta?.proofUrl ?? null,
    };
  });
}

export async function updateOrderStatusForTenant(params: {
  tenantId: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  actorId?: string;
}): Promise<TenantOrderListItem["status"]> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, params.orderId), eq(orders.tenantId, params.tenantId)))
    .limit(1);
  if (!order) throw new OrderError("Order not found.", "ORDER_NOT_FOUND");

  const allowed = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(params.status)) {
    throw new OrderError(
      `Cannot move an order from "${order.status}" to "${params.status}".`,
      "INVALID_TRANSITION"
    );
  }

  const now = new Date();
  const isDelivered = params.status === "delivered";
  const codCollected = isDelivered && order.paymentMethod === "cod";

  await db
    .update(orders)
    .set({
      status: params.status,
      ...(isDelivered ? { completedAt: now } : {}),
      ...(codCollected ? { paymentStatus: "paid" as const, paidAt: now } : {}),
    })
    .where(eq(orders.id, order.id));

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    status: params.status,
    note: params.note ?? (codCollected ? "Delivered — COD collected" : undefined),
    actorId: params.actorId,
  });

  if (codCollected) {
    await creditSaleForOrder(order.id, { immediateAvailable: true });
  } else if (isDelivered) {
    await releaseOrderSaleCredit(order.id);
  }

  return params.status;
}

export interface OrderRefundInfo {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  total: string;
  totalCentavos: number;
  gateway: string | null;
  gatewayPaymentId: string | null;
}

export async function getOrderPaymentForRefund(
  tenantId: string,
  orderId: string
): Promise<OrderRefundInfo | null> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
    .limit(1);
  if (!order) return null;

  const [payment] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(eq(paymentTransactions.orderId, order.id), eq(paymentTransactions.status, "paid"))
    )
    .orderBy(desc(paymentTransactions.paidAt))
    .limit(1);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus ?? "pending",
    paymentMethod: order.paymentMethod ?? "",
    total: order.total,
    totalCentavos: toCentavos(order.total),
    gateway: payment?.gateway ?? null,
    gatewayPaymentId: payment?.gatewayPaymentId ?? null,
  };
}

/** Marks the order + its payment transaction refunded and logs history. */
export async function markOrderRefunded(params: {
  tenantId: string;
  orderId: string;
  actorId?: string;
  note?: string;
}): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "refunded", paymentStatus: "refunded" })
      .where(and(eq(orders.id, params.orderId), eq(orders.tenantId, params.tenantId)));

    await tx
      .update(paymentTransactions)
      .set({ status: "refunded" })
      .where(
        and(
          eq(paymentTransactions.orderId, params.orderId),
          eq(paymentTransactions.status, "paid")
        )
      );

    await tx.insert(orderStatusHistory).values({
      orderId: params.orderId,
      status: "refunded",
      note: params.note ?? "Refund issued by seller",
      actorId: params.actorId,
    });

    await reverseSaleCreditForOrder(params.orderId);
  });
}

export interface OrderTrackingDelivery {
  provider: string;
  status: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverPlateNumber: string | null;
  driverLat: string | null;
  driverLng: string | null;
  driverLocationAt: Date | null;
  trackingUrl: string | null;
}

export interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  tenantSlug: string;
  tenantName: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  deliveryType: string;
  customerName: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  createdAt: Date;
  items: Array<{ title: string; quantity: number; unitPrice: string; lineTotal: string }>;
  history: Array<{ status: OrderStatus; note: string | null; createdAt: Date }>;
  delivery: OrderTrackingDelivery | null;
}

export async function getOrderForTracking(
  tenantSlug: string,
  orderNumber: string
): Promise<OrderTrackingData | null> {
  const db = getDb();
  const [row] = await db
    .select({ order: orders, tenant: tenants })
    .from(orders)
    .innerJoin(tenants, eq(orders.tenantId, tenants.id))
    .where(and(eq(orders.orderNumber, orderNumber), eq(tenants.slug, tenantSlug)))
    .limit(1);
  if (!row) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, row.order.id));

  const history = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, row.order.id))
    .orderBy(orderStatusHistory.createdAt);

  const [delivery] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.orderId, row.order.id))
    .orderBy(desc(deliveries.bookedAt))
    .limit(1);

  return {
    orderId: row.order.id,
    orderNumber: row.order.orderNumber,
    tenantSlug: row.tenant.slug,
    tenantName: row.tenant.name,
    status: row.order.status as OrderStatus,
    paymentStatus: row.order.paymentStatus ?? "pending",
    paymentMethod: row.order.paymentMethod ?? "",
    deliveryType: row.order.deliveryType ?? "delivery",
    customerName: row.order.guestName ?? "Customer",
    subtotal: row.order.subtotal,
    deliveryFee: row.order.deliveryFee ?? "0.00",
    total: row.order.total,
    createdAt: row.order.createdAt,
    items: items.map((item) => ({
      title: item.titleSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    history: history.map((entry) => ({
      status: entry.status as OrderStatus,
      note: entry.note,
      createdAt: entry.createdAt,
    })),
    delivery: delivery
      ? {
          provider: delivery.provider,
          status: delivery.status,
          driverName: delivery.driverName,
          driverPhone: delivery.driverPhone,
          driverPlateNumber: delivery.driverPlateNumber,
          driverLat: delivery.driverLat,
          driverLng: delivery.driverLng,
          driverLocationAt: delivery.driverLocationAt,
          trackingUrl: delivery.trackingUrl,
        }
      : null,
  };
}
