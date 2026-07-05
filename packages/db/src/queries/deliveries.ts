import { desc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { deliveries, deliveryQuotes, orderStatusHistory, orders } from "../schema/index";
import type { OrderStatus } from "./orders";

export interface RecordDeliveryQuoteInput {
  tenantId: string;
  orderId?: string;
  provider: "lalamove" | "grab" | "manual";
  quoteId: string;
  fee: string;
  currency?: string;
  etaMinutes?: number;
  expiresAt?: Date;
  rawResponseJson?: unknown;
}

export async function recordDeliveryQuote(input: RecordDeliveryQuoteInput): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(deliveryQuotes)
    .values({
      tenantId: input.tenantId,
      orderId: input.orderId,
      provider: input.provider,
      quoteId: input.quoteId,
      fee: input.fee,
      currency: input.currency ?? "PHP",
      etaMinutes: input.etaMinutes,
      expiresAt: input.expiresAt,
      rawResponseJson: input.rawResponseJson,
    })
    .returning({ id: deliveryQuotes.id });
  if (!row) throw new Error("Failed to record delivery quote");
  return row.id;
}

export interface CreateDeliveryBookingInput {
  orderId: string;
  quoteId?: string;
  provider: "lalamove" | "grab" | "manual";
  providerOrderId: string;
  status: string;
  trackingUrl?: string;
}

export async function createDeliveryBooking(input: CreateDeliveryBookingInput): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(deliveries)
    .values({
      orderId: input.orderId,
      quoteId: input.quoteId,
      provider: input.provider,
      providerOrderId: input.providerOrderId,
      status: input.status,
      trackingUrl: input.trackingUrl,
      bookedAt: new Date(),
    })
    .returning({ id: deliveries.id });
  if (!row) throw new Error("Failed to create delivery booking");
  return row.id;
}

export interface DeliveryStatusPatch {
  status?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlateNumber?: string;
  driverLat?: string;
  driverLng?: string;
  pickedUp?: boolean;
  delivered?: boolean;
}

/**
 * Applies a provider webhook update. Returns the linked order (id + tenant)
 * so the caller can advance the order status, or null when we don't know
 * this provider order id.
 */
export async function updateDeliveryByProviderOrderId(
  providerOrderId: string,
  patch: DeliveryStatusPatch
): Promise<{ deliveryId: string; orderId: string; tenantId: string; orderStatus: string } | null> {
  const db = getDb();
  const [row] = await db
    .select({ delivery: deliveries, order: orders })
    .from(deliveries)
    .innerJoin(orders, eq(deliveries.orderId, orders.id))
    .where(eq(deliveries.providerOrderId, providerOrderId))
    .limit(1);
  if (!row) return null;

  const now = new Date();
  const hasLocation = patch.driverLat !== undefined && patch.driverLng !== undefined;
  await db
    .update(deliveries)
    .set({
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.driverName !== undefined ? { driverName: patch.driverName } : {}),
      ...(patch.driverPhone !== undefined ? { driverPhone: patch.driverPhone } : {}),
      ...(patch.driverPlateNumber !== undefined
        ? { driverPlateNumber: patch.driverPlateNumber }
        : {}),
      ...(hasLocation
        ? { driverLat: patch.driverLat, driverLng: patch.driverLng, driverLocationAt: now }
        : {}),
      ...(patch.pickedUp ? { pickedUpAt: now } : {}),
      ...(patch.delivered ? { deliveredAt: now } : {}),
    })
    .where(eq(deliveries.id, row.delivery.id));

  return {
    deliveryId: row.delivery.id,
    orderId: row.order.id,
    tenantId: row.order.tenantId,
    orderStatus: row.order.status,
  };
}

export interface OrderDeliveryInfo {
  provider: string;
  status: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverPlateNumber: string | null;
  driverLat: string | null;
  driverLng: string | null;
  driverLocationAt: Date | null;
  trackingUrl: string | null;
  bookedAt: Date | null;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
}

/**
 * Courier-driven status update. The courier webhook is ground truth for the
 * physical delivery, so this bypasses the seller-side transition matrix but
 * never moves an order backwards or out of a terminal state.
 */
export async function advanceOrderStatusFromDelivery(
  orderId: string,
  nextStatus: Extract<OrderStatus, "out_for_delivery" | "delivered" | "cancelled">,
  note: string
): Promise<boolean> {
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return false;

  const rank: Record<string, number> = {
    pending_payment: 0,
    paid: 1,
    accepted: 2,
    preparing: 3,
    ready_for_pickup: 4,
    out_for_delivery: 5,
    delivered: 6,
    cancelled: 99,
    refunded: 99,
  };
  const current = rank[order.status] ?? 0;
  const next = rank[nextStatus] ?? 0;
  if (current >= 99) return false;
  if (nextStatus !== "cancelled" && next <= current) return false;

  const now = new Date();
  await db
    .update(orders)
    .set({
      status: nextStatus,
      ...(nextStatus === "delivered" ? { completedAt: now } : {}),
      ...(nextStatus === "delivered" && order.paymentMethod === "cod"
        ? { paymentStatus: "paid" as const, paidAt: now }
        : {}),
    })
    .where(eq(orders.id, orderId));
  await db.insert(orderStatusHistory).values({ orderId, status: nextStatus, note });
  return true;
}

export interface OrderForDeliveryBooking {
  orderId: string;
  orderNumber: string;
  status: string;
  deliveryType: string;
  customerName: string;
  customerPhone: string;
  dropoffAddress: string;
  dropoffNotes: string;
  existingProviderOrderId: string | null;
}

export async function getOrderForDeliveryBooking(
  tenantId: string,
  orderId: string
): Promise<OrderForDeliveryBooking | null> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order || order.tenantId !== tenantId) return null;

  const address = (order.deliveryAddressJson ?? {}) as { line1?: string; notes?: string };
  const [existing] = await db
    .select({ providerOrderId: deliveries.providerOrderId })
    .from(deliveries)
    .where(eq(deliveries.orderId, order.id))
    .limit(1);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    deliveryType: order.deliveryType ?? "delivery",
    customerName: order.guestName ?? "Customer",
    customerPhone: order.guestPhone ?? "",
    dropoffAddress: address.line1 ?? "",
    dropoffNotes: address.notes ?? "",
    existingProviderOrderId: existing?.providerOrderId ?? null,
  };
}

export async function getDeliveryForOrder(orderId: string): Promise<OrderDeliveryInfo | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.orderId, orderId))
    .orderBy(desc(deliveries.bookedAt))
    .limit(1);
  if (!row) return null;
  return {
    provider: row.provider,
    status: row.status,
    driverName: row.driverName,
    driverPhone: row.driverPhone,
    driverPlateNumber: row.driverPlateNumber,
    driverLat: row.driverLat,
    driverLng: row.driverLng,
    driverLocationAt: row.driverLocationAt,
    trackingUrl: row.trackingUrl,
    bookedAt: row.bookedAt,
    pickedUpAt: row.pickedUpAt,
    deliveredAt: row.deliveredAt,
  };
}
