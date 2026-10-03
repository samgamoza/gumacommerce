/**
 * Phase 2 order model — pure rules, no database (docs/PHASE-2-MIGRATION-SPEC.md §2).
 *
 * An order is three independent facts: order_state, payment_state and
 * fulfillment_state. Every change goes through planOrderAction(), which either
 * returns the next states or explains why the action isn't allowed. The DB
 * service (order-lifecycle.ts) applies the plan inside one transaction.
 *
 * Kept free of imports so it can be unit-tested exhaustively and shared with
 * the UI.
 */

export type OrderState = "open" | "completed" | "cancelled";
export type PaymentState =
  | "unpaid"
  | "pending_verification"
  | "paid"
  | "cod_due"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type FulfillmentState =
  | "unfulfilled"
  | "ready"
  | "booked"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery"
  | "returned";

export const ORDER_STATES: readonly OrderState[] = ["open", "completed", "cancelled"];
export const PAYMENT_STATES: readonly PaymentState[] = [
  "unpaid",
  "pending_verification",
  "paid",
  "cod_due",
  "failed",
  "refunded",
  "partially_refunded",
];
export const FULFILLMENT_STATES: readonly FulfillmentState[] = [
  "unfulfilled",
  "ready",
  "booked",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "failed_delivery",
  "returned",
];

export interface OrderFacts {
  orderState: OrderState;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
  accepted: boolean;
  paymentMethod: string;
}

export type ActionSource = "seller" | "courier" | "system" | "buyer" | "gateway";

export type OrderAction =
  | { type: "submit_payment_proof" }
  | { type: "confirm_payment" }
  | { type: "reject_payment_proof" }
  | { type: "accept" }
  | { type: "mark_ready" }
  | { type: "fulfillment_update"; to: FulfillmentState }
  /** Courier cancelled/rejected/expired a booking before pickup. */
  | { type: "booking_cancelled" }
  | { type: "cancel" }
  | { type: "expire" }
  | { type: "refund" };

export type PlanResult =
  | {
      ok: true;
      changed: boolean;
      next: OrderFacts;
      /** Put reserved stock back (claimed once per order by the DB layer). */
      restock: boolean;
      /** COD cash collected on delivery → payment becomes paid. */
      codCollected: boolean;
      /** A live courier booking exists and must be cancelled with the provider. */
      cancelCourierBooking: boolean;
    }
  | { ok: false; reason: string };

/** Forward order of physical progress. failed_delivery/returned are side exits. */
const FULFILLMENT_RANK: Record<FulfillmentState, number> = {
  unfulfilled: 0,
  ready: 1,
  booked: 2,
  picked_up: 3,
  out_for_delivery: 4,
  delivered: 5,
  failed_delivery: 4,
  returned: 6,
};

/** Goods are with a courier — the order can't be cancelled or refunded until it's back or delivered. */
export const IN_TRANSIT: ReadonlySet<FulfillmentState> = new Set(["picked_up", "out_for_delivery"]);

/** Goods are back with (or never left) the seller → stock goes back on cancel/refund. */
const GOODS_WITH_SELLER: ReadonlySet<FulfillmentState> = new Set([
  "unfulfilled",
  "ready",
  "booked",
  "returned",
]);

const PAYABLE: ReadonlySet<PaymentState> = new Set(["unpaid", "pending_verification", "failed"]);

function settle(next: OrderFacts): OrderFacts {
  // Invariant 5: paid + delivered ⇒ completed.
  if (
    next.orderState === "open" &&
    next.paymentState === "paid" &&
    next.fulfillmentState === "delivered"
  ) {
    return { ...next, orderState: "completed" };
  }
  return next;
}

function ok(
  current: OrderFacts,
  next: OrderFacts,
  extra: Partial<{ restock: boolean; codCollected: boolean; cancelCourierBooking: boolean }> = {}
): PlanResult {
  const settled = settle(next);
  const changed =
    settled.orderState !== current.orderState ||
    settled.paymentState !== current.paymentState ||
    settled.fulfillmentState !== current.fulfillmentState ||
    settled.accepted !== current.accepted;
  return {
    ok: true,
    changed,
    next: settled,
    restock: extra.restock ?? false,
    codCollected: extra.codCollected ?? false,
    cancelCourierBooking: extra.cancelCourierBooking ?? false,
  };
}

const noop = (current: OrderFacts): PlanResult => ok(current, current);
const no = (reason: string): PlanResult => ({ ok: false, reason });

/**
 * Decide what an action does to an order. Courier/gateway sources get a no-op
 * instead of an error for stale or replayed events, so webhooks never fail on
 * a repeat; sellers get a clear error.
 */
export function planOrderAction(
  current: OrderFacts,
  action: OrderAction,
  source: ActionSource
): PlanResult {
  const lenient = source === "courier" || source === "gateway";
  const closed = current.orderState !== "open";

  const allowedFor: Record<ActionSource, ReadonlySet<OrderAction["type"]>> = {
    seller: new Set([
      "confirm_payment",
      "reject_payment_proof",
      "accept",
      "mark_ready",
      "fulfillment_update",
      "booking_cancelled",
      "cancel",
      "refund",
    ]),
    courier: new Set(["fulfillment_update", "booking_cancelled"]),
    gateway: new Set(["confirm_payment"]),
    buyer: new Set(["submit_payment_proof"]),
    system: new Set(["expire"]),
  };
  if (!allowedFor[source].has(action.type)) {
    return no(`A ${source} can't ${action.type.replace(/_/g, " ")} an order.`);
  }

  switch (action.type) {
    case "submit_payment_proof": {
      if (closed) return no("This order is closed. Contact the shop if you already paid.");
      if (current.paymentMethod === "cod") return no("Cash on delivery orders don't need a payment proof.");
      if (current.paymentState === "pending_verification") return noop(current);
      if (!PAYABLE.has(current.paymentState)) return no("This order is already paid.");
      return ok(current, { ...current, paymentState: "pending_verification" });
    }

    case "confirm_payment": {
      if (current.paymentState === "paid") return noop(current);
      if (closed) {
        return no("This order was already closed — refund the buyer instead of confirming the payment.");
      }
      if (!PAYABLE.has(current.paymentState) && current.paymentState !== "cod_due") {
        return no(`Can't confirm a payment that is ${current.paymentState.replace(/_/g, " ")}.`);
      }
      return ok(current, { ...current, paymentState: "paid" });
    }

    case "reject_payment_proof": {
      if (current.paymentState !== "pending_verification") {
        return lenient ? noop(current) : no("There's no payment proof waiting for review.");
      }
      return ok(current, { ...current, paymentState: "unpaid" });
    }

    case "accept": {
      if (closed) return no("This order is closed.");
      if (current.accepted) return noop(current);
      return ok(current, { ...current, accepted: true });
    }

    case "mark_ready": {
      if (closed) return no("This order is closed.");
      if (current.fulfillmentState === "ready") return noop(current);
      if (current.fulfillmentState !== "unfulfilled") {
        return no("Only orders that haven't shipped yet can be marked ready.");
      }
      if (current.paymentState !== "paid" && current.paymentState !== "cod_due") {
        return no("Confirm the payment first, then pack the order.");
      }
      return ok(current, { ...current, fulfillmentState: "ready", accepted: true });
    }

    case "fulfillment_update": {
      const to = action.to;
      if (current.fulfillmentState === to) return noop(current);
      if (closed) {
        return lenient ? noop(current) : no("This order is closed.");
      }
      const from = current.fulfillmentState;
      let allowed: boolean;
      if (to === "failed_delivery") {
        allowed = from === "booked" || IN_TRANSIT.has(from);
      } else if (to === "returned") {
        allowed = from === "failed_delivery" || IN_TRANSIT.has(from);
      } else if (from === "failed_delivery" || from === "returned") {
        // Rebook after a failed attempt or a return.
        allowed = to === "booked" || to === "ready" || (from === "failed_delivery" && FULFILLMENT_RANK[to] >= 3);
      } else {
        allowed = FULFILLMENT_RANK[to] > FULFILLMENT_RANK[from];
      }
      if (!allowed) {
        return lenient
          ? noop(current)
          : no(`Can't move delivery from "${from.replace(/_/g, " ")}" to "${to.replace(/_/g, " ")}".`);
      }
      // Delivering an unpaid non-COD order is the seller's call; the payment can
      // still be confirmed afterwards, which then completes the order.
      const codCollected = to === "delivered" && current.paymentState === "cod_due";
      return ok(
        current,
        {
          ...current,
          fulfillmentState: to,
          paymentState: codCollected ? "paid" : current.paymentState,
          accepted: true,
        },
        { codCollected }
      );
    }

    case "booking_cancelled": {
      if (closed) return noop(current);
      if (current.fulfillmentState === "booked") {
        return ok(current, { ...current, fulfillmentState: "ready" });
      }
      if (IN_TRANSIT.has(current.fulfillmentState)) {
        return ok(current, { ...current, fulfillmentState: "failed_delivery" });
      }
      return noop(current);
    }

    case "cancel": {
      if (current.orderState === "cancelled") {
        return lenient ? noop(current) : no("This order is already cancelled.");
      }
      if (closed) return no("A completed order can't be cancelled — refund it instead.");
      if (current.paymentState === "paid") {
        return no("This order is already paid. Use “Refund” so the buyer gets their money back.");
      }
      if (IN_TRANSIT.has(current.fulfillmentState) || current.fulfillmentState === "delivered") {
        return no("The order is already with the courier. Wait for it to be delivered or returned.");
      }
      return ok(
        current,
        { ...current, orderState: "cancelled" },
        {
          restock: GOODS_WITH_SELLER.has(current.fulfillmentState),
          cancelCourierBooking: current.fulfillmentState === "booked",
        }
      );
    }

    case "expire": {
      if (
        current.orderState !== "open" ||
        current.paymentState !== "unpaid" ||
        current.fulfillmentState !== "unfulfilled"
      ) {
        return noop(current);
      }
      return ok(current, { ...current, orderState: "cancelled" }, { restock: true });
    }

    case "refund": {
      if (current.paymentState === "refunded") return no("This order has already been refunded.");
      if (current.paymentState !== "paid") {
        return no("Only paid orders can be refunded. Cancel unpaid orders instead.");
      }
      if (IN_TRANSIT.has(current.fulfillmentState)) {
        return no("The order is with the courier. Refund it once it's delivered or returned.");
      }
      return ok(
        current,
        { ...current, paymentState: "refunded", orderState: "cancelled" },
        {
          restock: GOODS_WITH_SELLER.has(current.fulfillmentState),
          cancelCourierBooking: current.fulfillmentState === "booked",
        }
      );
    }
  }
}

/** Returns the broken invariant, or null. Mirrors the CHECK constraints in 0023. */
export function invariantViolation(f: OrderFacts): string | null {
  if (f.orderState === "completed" && !(f.paymentState === "paid" && f.fulfillmentState === "delivered")) {
    return "completed orders must be paid and delivered";
  }
  if (f.orderState === "cancelled" && IN_TRANSIT.has(f.fulfillmentState)) {
    return "cancelled orders can't be in transit";
  }
  if (f.orderState === "cancelled" && f.fulfillmentState === "delivered" && f.paymentState !== "refunded") {
    return "a delivered order can only be closed by a refund";
  }
  if (f.paymentState === "cod_due" && f.paymentMethod !== "cod") {
    return "cod_due is only for cash on delivery";
  }
  if (f.orderState === "open" && f.paymentState === "paid" && f.fulfillmentState === "delivered") {
    return "paid and delivered orders must be completed";
  }
  return null;
}

/** "Book delivery" is offered for paid or COD orders that haven't left the shop. */
export function bookingBlockedReason(f: OrderFacts): string | null {
  if (f.orderState !== "open") return "This order is closed.";
  if (f.paymentState !== "paid" && f.paymentState !== "cod_due") {
    return "Confirm the payment before booking a rider.";
  }
  if (!["unfulfilled", "ready", "failed_delivery", "returned"].includes(f.fulfillmentState)) {
    return "A rider is already handling this order.";
  }
  return null;
}

// ─── Legacy columns (dual-write until migration 0024) ────────────────────────

export type LegacyOrderStatus =
  | "pending_payment"
  | "paid"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Keep identical to the CASE in drizzle/0022_phase2_backfill.sql. */
export function legacyStatusOf(f: {
  orderState: OrderState;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
  accepted: boolean;
}): LegacyOrderStatus {
  if (f.orderState === "cancelled") return f.paymentState === "refunded" ? "refunded" : "cancelled";
  if (f.orderState === "completed") return "delivered";
  if (f.fulfillmentState === "delivered") return "delivered";
  if (
    f.fulfillmentState === "picked_up" ||
    f.fulfillmentState === "out_for_delivery" ||
    f.fulfillmentState === "failed_delivery" ||
    f.fulfillmentState === "returned"
  ) {
    return "out_for_delivery";
  }
  if (f.fulfillmentState === "ready") return "ready_for_pickup";
  if (f.accepted) return "accepted";
  if (f.paymentState === "paid") return "paid";
  if (f.paymentState === "cod_due") return "accepted";
  return "pending_payment";
}

export function legacyPaymentStatusOf(p: PaymentState): "pending" | "paid" | "failed" | "refunded" {
  switch (p) {
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "refunded":
    case "partially_refunded":
      return "refunded";
    default:
      return "pending";
  }
}

// ─── Merchant view ───────────────────────────────────────────────────────────

/** The merchant's to-do buckets: To pay · To confirm · To pack · To ship · Shipping · Done. */
export type OrderBucket =
  | "to_pay"
  | "to_confirm"
  | "to_pack"
  | "to_ship"
  | "shipping"
  | "attention"
  | "done"
  | "cancelled";

export function orderBucketOf(f: {
  orderState: OrderState;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
}): OrderBucket {
  if (f.orderState === "cancelled") return "cancelled";
  if (f.orderState === "completed") return "done";
  if (f.fulfillmentState === "failed_delivery" || f.fulfillmentState === "returned") return "attention";
  if (f.paymentState === "pending_verification") return "to_confirm";
  if (f.paymentState === "unpaid" || f.paymentState === "failed") {
    // Delivered-but-unpaid (seller shipped before confirming) still needs the payment.
    return f.fulfillmentState === "delivered" ? "to_confirm" : "to_pay";
  }
  if (f.fulfillmentState === "unfulfilled") return "to_pack";
  if (f.fulfillmentState === "ready") return "to_ship";
  return "shipping";
}

export const ORDER_BUCKET_LABELS: Record<OrderBucket, string> = {
  to_pay: "To pay",
  to_confirm: "To confirm",
  to_pack: "To pack",
  to_ship: "To ship",
  shipping: "Shipping",
  attention: "Needs attention",
  done: "Done",
  cancelled: "Cancelled",
};

export function describeStates(f: {
  orderState: OrderState;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
}): string {
  return `${f.orderState}/${f.paymentState}/${f.fulfillmentState}`;
}
