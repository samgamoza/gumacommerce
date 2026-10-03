import { and, eq, inArray, isNull, lt, notExists, sql } from "drizzle-orm";
import { getDb } from "../client";
import {
  orderItems,
  orderStatusHistory,
  orders,
  paymentTransactions,
  productVariants,
  products,
} from "../schema/index";
import {
  creditSaleForOrder,
  releaseOrderSaleCredit,
  reverseSaleCreditForOrder,
} from "./wallet";
import { ORDER_STATUS_TRANSITIONS, OrderError, type OrderStatus } from "./order-status";
import { recordStockMovement } from "./stock-ledger";

/**
 * The one place an order's status changes after checkout.
 *
 * Every transition runs in a transaction that row-locks the order
 * (SELECT … FOR UPDATE), validates the move for the caller, writes the status
 * history, and applies the stock side effects in the same transaction. Wallet
 * side effects run right after commit; they are idempotent (unique ledger
 * entries), so a retry after a crash between the two is safe.
 *
 * Callers:
 *  - seller  → admin PATCH /api/orders/[id] (accept, prepare, ship, deliver, cancel)
 *  - courier → Lalamove / Grab / BayanGo webhooks (forward-only)
 *  - system  → unpaid-order expiry cron (pending_payment → cancelled)
 * Payment confirmation and refunds have their own functions below/next door
 * because they also touch payment_transactions.
 */

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type OrderRow = typeof orders.$inferSelect;

export type TransitionSource = "seller" | "courier" | "system";

/** Statuses a seller may set directly. Paid → payment confirm; refunded → refund flow. */
export const SELLER_SETTABLE_STATUSES = [
  "accepted",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const satisfies readonly OrderStatus[];

const TERMINAL: ReadonlySet<OrderStatus> = new Set(["cancelled", "refunded"]);

/** Physical progress order, used for courier updates (forward-only). */
const PROGRESS_RANK: Record<OrderStatus, number> = {
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

/** Restock only makes sense while the goods are still with the seller. */
const GOODS_LEFT_SHOP: ReadonlySet<OrderStatus> = new Set(["out_for_delivery", "delivered"]);

export interface TransitionResult {
  changed: boolean;
  from: OrderStatus;
  to: OrderStatus;
  restocked: boolean;
}

async function lockOrder(tx: Tx, orderId: string, tenantId?: string): Promise<OrderRow | null> {
  const [order] = await tx
    .select()
    .from(orders)
    .where(tenantId ? and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)) : eq(orders.id, orderId))
    .limit(1)
    .for("update");
  return order ?? null;
}

/**
 * Puts reserved stock back, exactly once per order. Mirrors the checkout
 * decrement: only variants of products that track inventory.
 */
export type RestockReason = "restock_cancel" | "restock_refund" | "restock_expiry";

export async function restockOrderInTx(
  tx: Tx,
  orderId: string,
  reason: RestockReason = "restock_cancel",
  actorId?: string | null
): Promise<boolean> {
  const [claimed] = await tx
    .update(orders)
    .set({ stockRestoredAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.stockRestoredAt)))
    .returning({ id: orders.id, tenantId: orders.tenantId });
  if (!claimed) return false;

  const lines = await tx
    .select({
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
      trackInventory: products.trackInventory,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, orderId));

  // One ledger row per variant even if the order had it on two lines.
  const qtyByVariant = new Map<string, number>();
  for (const line of lines) {
    if (!line.variantId || !line.trackInventory) continue;
    qtyByVariant.set(line.variantId, (qtyByVariant.get(line.variantId) ?? 0) + line.quantity);
  }

  for (const [variantId, quantity] of qtyByVariant) {
    const [updated] = await tx
      .update(productVariants)
      .set({ stockQty: sql`coalesce(${productVariants.stockQty}, 0) + ${quantity}` })
      .where(eq(productVariants.id, variantId))
      .returning({ stockQty: productVariants.stockQty });
    if (!updated) continue; // variant deleted since the sale
    await recordStockMovement(tx, {
      tenantId: claimed.tenantId,
      variantId,
      orderId,
      reason,
      delta: quantity,
      balanceAfter: updated.stockQty,
      actorId,
    });
  }
  return true;
}

function defaultNote(to: OrderStatus, source: TransitionSource, codCollected: boolean): string | undefined {
  if (codCollected) return "Delivered — COD collected";
  if (source === "system" && to === "cancelled") return "Not paid in time — cancelled and stock released";
  if (to === "cancelled") return "Cancelled by seller — stock released";
  return undefined;
}

export async function transitionOrderStatus(input: {
  orderId: string;
  to: OrderStatus;
  source: TransitionSource;
  /** Required for seller transitions: scopes the lock to the seller's shop. */
  tenantId?: string;
  actorId?: string;
  note?: string;
}): Promise<TransitionResult> {
  if (input.source === "seller" && !input.tenantId) {
    throw new Error("transitionOrderStatus: seller transitions must be tenant-scoped.");
  }

  const db = getDb();
  const outcome = await db.transaction(async (tx) => {
    const order = await lockOrder(tx, input.orderId, input.tenantId);
    if (!order) throw new OrderError("Order not found.", "ORDER_NOT_FOUND");

    const from = order.status as OrderStatus;
    const to = input.to;
    const unchanged = { changed: false, from, to, restocked: false, codCollected: false };

    if (input.source === "seller") {
      if (!(SELLER_SETTABLE_STATUSES as readonly string[]).includes(to)) {
        throw new OrderError(
          to === "paid"
            ? "Use “Confirm payment” to mark an order paid."
            : "Use “Refund” to refund an order.",
          "INVALID_TRANSITION"
        );
      }
      if (!(ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to)) {
        throw new OrderError(`Cannot move an order from "${from}" to "${to}".`, "INVALID_TRANSITION");
      }
      if (to === "cancelled" && order.paymentStatus === "paid") {
        throw new OrderError(
          "This order is already paid. Use “Refund” instead of cancel so the buyer gets their money back.",
          "INVALID_TRANSITION"
        );
      }
    } else if (input.source === "courier") {
      if (to !== "out_for_delivery" && to !== "delivered") {
        throw new Error(`Courier updates can only move orders forward, not to "${to}".`);
      }
      if (TERMINAL.has(from) || PROGRESS_RANK[to] <= PROGRESS_RANK[from]) return unchanged;
    } else {
      // system: only unpaid expiry
      if (!(from === "pending_payment" && to === "cancelled")) return unchanged;
      if (order.paymentStatus === "paid") return unchanged;
    }

    const now = new Date();
    const delivered = to === "delivered";
    const codCollected =
      delivered && order.paymentMethod === "cod" && order.paymentStatus !== "paid";

    await tx
      .update(orders)
      .set({
        status: to,
        ...(delivered ? { completedAt: now } : {}),
        ...(codCollected ? { paymentStatus: "paid" as const, paidAt: now } : {}),
      })
      .where(eq(orders.id, order.id));

    if (codCollected) {
      // COD has no payment row yet; record the cash the rider collected.
      await tx
        .insert(paymentTransactions)
        .values({
          orderId: order.id,
          tenantId: order.tenantId,
          gateway: "cod",
          gatewayIntentId: `cod_${order.id}`,
          amount: order.total,
          status: "paid",
          methodType: "cod",
          paidAt: now,
          rawWebhookJson: { collectedVia: input.source },
        })
        .onConflictDoNothing({ target: paymentTransactions.gatewayIntentId });
    }

    let restocked = false;
    if (to === "cancelled" && !GOODS_LEFT_SHOP.has(from)) {
      restocked = await restockOrderInTx(
        tx,
        order.id,
        input.source === "system" ? "restock_expiry" : "restock_cancel",
        input.actorId
      );
    }

    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      status: to,
      note: input.note ?? defaultNote(to, input.source, codCollected),
      actorId: input.actorId,
    });

    return { changed: true, from, to, restocked, codCollected };
  });

  if (outcome.changed && outcome.to === "delivered") {
    if (outcome.codCollected) {
      await creditSaleForOrder(input.orderId, { immediateAvailable: true });
    } else {
      await releaseOrderSaleCredit(input.orderId);
    }
  }

  return {
    changed: outcome.changed,
    from: outcome.from,
    to: outcome.to,
    restocked: outcome.restocked,
  };
}

// ─── Refunds ─────────────────────────────────────────────────────────────────

export interface GatewayRefundRequest {
  gateway: string;
  gatewayPaymentId: string | null;
  totalCentavos: number;
  orderNumber: string;
}

export interface RefundOrderResult {
  gateway: string;
  refundId?: string;
  restocked: boolean;
  /** True for manual/COD: the seller returns the money directly to the buyer. */
  refundedOutsidePlatform: boolean;
}

const LOCK_NOT_AVAILABLE = "55P03";

/**
 * Refunds a paid order exactly once.
 *
 * The order row is locked with NOWAIT for the whole operation, so a second
 * click (or a retry while the first is running) fails fast instead of issuing a
 * second gateway refund. The gateway call happens inside that lock; if the DB
 * write then fails, the error is raised with the gateway refund id so it can be
 * reconciled by hand.
 */
export async function refundOrder(params: {
  tenantId: string;
  orderId: string;
  actorId?: string;
  note?: string;
  refundAtGateway?: (request: GatewayRefundRequest) => Promise<{ refundId?: string }>;
}): Promise<RefundOrderResult> {
  const db = getDb();
  let gatewayRefundId: string | undefined;

  try {
    const result = await db.transaction(async (tx) => {
      // Raw SQL on purpose: drizzle 0.38 renders `{ noWait: true }` as the
      // invalid "for update no wait". NOWAIT makes a concurrent refund fail
      // fast (55P03) instead of queueing up for a second gateway call.
      await tx.execute(
        sql`select 1 from ${orders} where ${orders.id} = ${params.orderId} and ${orders.tenantId} = ${params.tenantId} for update nowait`
      );
      const [order] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, params.orderId), eq(orders.tenantId, params.tenantId)))
        .limit(1);
      if (!order) throw new OrderError("Order not found.", "ORDER_NOT_FOUND");
      if (order.status === "refunded" || order.paymentStatus === "refunded") {
        throw new OrderError("This order has already been refunded.", "INVALID_TRANSITION");
      }
      if (order.paymentStatus !== "paid") {
        throw new OrderError(
          "Only paid orders can be refunded. Cancel unpaid orders instead.",
          "INVALID_TRANSITION"
        );
      }

      const [txn] = await tx
        .select()
        .from(paymentTransactions)
        .where(
          and(eq(paymentTransactions.orderId, order.id), eq(paymentTransactions.status, "paid"))
        )
        .orderBy(sql`${paymentTransactions.paidAt} desc nulls last`)
        .limit(1);

      const gateway = txn?.gateway ?? (order.paymentMethod === "cod" ? "cod" : "manual");
      const refundedOutsidePlatform = gateway !== "paymongo";

      if (!refundedOutsidePlatform) {
        if (!txn?.gatewayPaymentId) {
          throw new OrderError(
            "PayMongo payment id is missing for this order — refund it from the PayMongo dashboard.",
            "INVALID_TRANSITION"
          );
        }
        if (!params.refundAtGateway) {
          throw new Error("refundOrder: refundAtGateway is required for PayMongo payments.");
        }
        const refund = await params.refundAtGateway({
          gateway,
          gatewayPaymentId: txn.gatewayPaymentId,
          totalCentavos: Math.round(Number(order.total) * 100),
          orderNumber: order.orderNumber,
        });
        gatewayRefundId = refund.refundId;
      }

      const from = order.status as OrderStatus;
      await tx
        .update(orders)
        .set({ status: "refunded", paymentStatus: "refunded" })
        .where(eq(orders.id, order.id));
      await tx
        .update(paymentTransactions)
        .set({ status: "refunded" })
        .where(
          and(eq(paymentTransactions.orderId, order.id), eq(paymentTransactions.status, "paid"))
        );

      const restocked = GOODS_LEFT_SHOP.has(from)
        ? false
        : await restockOrderInTx(tx, order.id, "restock_refund", params.actorId);

      const baseNote =
        params.note ??
        (refundedOutsidePlatform
          ? "Refunded by seller — money returned to the buyer directly"
          : "Refund issued via PayMongo");
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "refunded",
        note: gatewayRefundId ? `${baseNote} (${gatewayRefundId})` : baseNote,
        actorId: params.actorId,
      });

      return { gateway, refundId: gatewayRefundId, restocked, refundedOutsidePlatform };
    });

    await reverseSaleCreditForOrder(params.orderId);
    return result;
  } catch (error) {
    // postgres-js puts the SQLSTATE on `code`; newer drizzle wraps it in `cause`.
    const e = error as { code?: string; cause?: { code?: string } } | null;
    if (e?.code === LOCK_NOT_AVAILABLE || e?.cause?.code === LOCK_NOT_AVAILABLE) {
      throw new OrderError(
        "A refund for this order is already in progress. Refresh in a moment.",
        "INVALID_TRANSITION"
      );
    }
    if (gatewayRefundId) {
      // Money left the gateway but we could not record it. Surface loudly.
      const wrapped = new Error(
        `Refund ${gatewayRefundId} was issued at the gateway but could not be recorded: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      (wrapped as Error & { gatewayRefundId?: string }).gatewayRefundId = gatewayRefundId;
      throw wrapped;
    }
    throw error;
  }
}

// ─── Unpaid order expiry ─────────────────────────────────────────────────────

export const DEFAULT_UNPAID_EXPIRY_HOURS = 24;

/**
 * Cancels online/manual orders still unpaid after `olderThanHours`, releasing
 * their stock. Orders where the buyer already submitted a payment reference
 * (transaction "processing") are left for the seller to confirm.
 */
export async function expireUnpaidOrders(options: {
  olderThanHours?: number;
  limit?: number;
} = {}): Promise<{ expired: number; orderIds: string[] }> {
  const hours = options.olderThanHours ?? DEFAULT_UNPAID_EXPIRY_HOURS;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const db = getDb();

  const candidates = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, "pending_payment"),
        lt(orders.createdAt, cutoff),
        notExists(
          db
            .select({ one: sql`1` })
            .from(paymentTransactions)
            .where(
              and(
                eq(paymentTransactions.orderId, orders.id),
                inArray(paymentTransactions.status, ["processing", "paid"])
              )
            )
        )
      )
    )
    .orderBy(orders.createdAt)
    .limit(options.limit ?? 200);

  const expiredIds: string[] = [];
  for (const candidate of candidates) {
    try {
      const result = await transitionOrderStatus({
        orderId: candidate.id,
        to: "cancelled",
        source: "system",
        note: `Not paid within ${hours} hours — cancelled and stock released`,
      });
      if (result.changed) expiredIds.push(candidate.id);
    } catch (error) {
      // Paid (or changed by the seller) between the scan and the lock — skip it.
      if (!(error instanceof OrderError)) throw error;
    }
  }
  return { expired: expiredIds.length, orderIds: expiredIds };
}
