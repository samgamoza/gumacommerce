import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FULFILLMENT_STATES,
  ORDER_STATES,
  PAYMENT_STATES,
  invariantViolation,
  legacyStatusOf,
  orderBucketOf,
  planOrderAction,
  type ActionSource,
  type OrderAction,
  type OrderFacts,
} from "./queries/order-state";

const ACTIONS: OrderAction[] = [
  { type: "submit_payment_proof" },
  { type: "confirm_payment" },
  { type: "reject_payment_proof" },
  { type: "accept" },
  { type: "mark_ready" },
  ...FULFILLMENT_STATES.map((to) => ({ type: "fulfillment_update" as const, to })),
  { type: "booking_cancelled" },
  { type: "cancel" },
  { type: "expire" },
  { type: "refund" },
];
const SOURCES: ActionSource[] = ["seller", "courier", "system", "buyer", "gateway"];

/** Every valid starting point (states that satisfy the invariants). */
function* validStates(): Generator<OrderFacts> {
  for (const orderState of ORDER_STATES)
    for (const paymentState of PAYMENT_STATES)
      for (const fulfillmentState of FULFILLMENT_STATES)
        for (const paymentMethod of ["cod", "gcash"])
          for (const accepted of [false, true]) {
            const f = { orderState, paymentState, fulfillmentState, paymentMethod, accepted };
            if (!invariantViolation(f)) yield f;
          }
}

describe("order state machine", () => {
  it("no allowed action ever breaks an invariant (exhaustive)", () => {
    let checked = 0;
    for (const start of validStates())
      for (const action of ACTIONS)
        for (const source of SOURCES) {
          const plan = planOrderAction(start, action, source);
          checked += 1;
          if (!plan.ok) continue;
          const broken = invariantViolation(plan.next);
          assert.equal(
            broken,
            null,
            `${JSON.stringify(start)} --${JSON.stringify(action)}/${source}--> ${JSON.stringify(plan.next)}: ${broken}`
          );
          if (!plan.changed) assert.deepEqual(plan.next, start, "a no-op must not change anything");
          if (plan.restock) assert.equal(plan.next.orderState, "cancelled", "restock only when closing");
        }
    assert.ok(checked > 10_000);
  });

  it("terminal orders never reopen", () => {
    for (const start of validStates()) {
      if (start.orderState === "open") continue;
      for (const action of ACTIONS)
        for (const source of SOURCES) {
          const plan = planOrderAction(start, action, source);
          if (plan.ok) assert.notEqual(plan.next.orderState, "open");
        }
    }
  });

  it("courier and gateway events never error (replays are no-ops)", () => {
    for (const start of validStates()) {
      for (const to of FULFILLMENT_STATES) {
        assert.equal(planOrderAction(start, { type: "fulfillment_update", to }, "courier").ok, true);
      }
      assert.equal(planOrderAction(start, { type: "booking_cancelled" }, "courier").ok, true);
    }
  });

  const base: OrderFacts = {
    orderState: "open",
    paymentState: "cod_due",
    fulfillmentState: "unfulfilled",
    accepted: false,
    paymentMethod: "cod",
  };

  it("COD happy path ends completed and paid", () => {
    let f = base;
    for (const to of ["ready", "booked", "picked_up", "out_for_delivery", "delivered"] as const) {
      const plan = planOrderAction(f, to === "ready" ? { type: "mark_ready" } : { type: "fulfillment_update", to }, to === "ready" ? "seller" : "courier");
      assert.ok(plan.ok);
      if (to === "delivered") assert.equal(plan.codCollected, true);
      f = plan.next;
    }
    assert.equal(f.orderState, "completed");
    assert.equal(f.paymentState, "paid");
  });

  it("manual payment: proof → confirm → completes on delivery", () => {
    const start: OrderFacts = { ...base, paymentState: "unpaid", paymentMethod: "gcash" };
    const proof = planOrderAction(start, { type: "submit_payment_proof" }, "buyer");
    assert.ok(proof.ok && proof.next.paymentState === "pending_verification");
    const rejected = planOrderAction(proof.next, { type: "reject_payment_proof" }, "seller");
    assert.ok(rejected.ok && rejected.next.paymentState === "unpaid");
    const confirmed = planOrderAction(proof.next, { type: "confirm_payment" }, "seller");
    assert.ok(confirmed.ok && confirmed.next.paymentState === "paid");
    const done = planOrderAction(confirmed.next, { type: "fulfillment_update", to: "delivered" }, "seller");
    assert.ok(done.ok && done.next.orderState === "completed");
  });

  it("paid orders refund instead of cancel; in-transit orders can't do either", () => {
    const paid: OrderFacts = { ...base, paymentState: "paid", paymentMethod: "gcash" };
    assert.equal(planOrderAction(paid, { type: "cancel" }, "seller").ok, false);
    const refund = planOrderAction(paid, { type: "refund" }, "seller");
    assert.ok(refund.ok && refund.restock && refund.next.orderState === "cancelled");
    const moving = { ...paid, fulfillmentState: "out_for_delivery" as const };
    assert.equal(planOrderAction(moving, { type: "refund" }, "seller").ok, false);
    assert.equal(planOrderAction({ ...moving, paymentState: "cod_due", paymentMethod: "cod" }, { type: "cancel" }, "seller").ok, false);
  });

  it("cancelling a booked order asks to cancel the courier booking", () => {
    const booked = { ...base, fulfillmentState: "booked" as const };
    const plan = planOrderAction(booked, { type: "cancel" }, "seller");
    assert.ok(plan.ok && plan.cancelCourierBooking && plan.restock);
  });

  it("expiry only touches untouched unpaid orders", () => {
    const unpaid: OrderFacts = { ...base, paymentState: "unpaid", paymentMethod: "gcash" };
    const e = planOrderAction(unpaid, { type: "expire" }, "system");
    assert.ok(e.ok && e.changed && e.next.orderState === "cancelled");
    const proof = planOrderAction({ ...unpaid, paymentState: "pending_verification" }, { type: "expire" }, "system");
    assert.ok(proof.ok && !proof.changed);
  });

  it("buckets match the merchant tabs", () => {
    assert.equal(orderBucketOf({ ...base, paymentState: "unpaid" }), "to_pay");
    assert.equal(orderBucketOf({ ...base, paymentState: "pending_verification" }), "to_confirm");
    assert.equal(orderBucketOf(base), "to_pack");
    assert.equal(orderBucketOf({ ...base, fulfillmentState: "ready" }), "to_ship");
    assert.equal(orderBucketOf({ ...base, fulfillmentState: "out_for_delivery" }), "shipping");
    assert.equal(orderBucketOf({ ...base, fulfillmentState: "failed_delivery" }), "attention");
    assert.equal(orderBucketOf({ ...base, orderState: "completed", paymentState: "paid", fulfillmentState: "delivered" }), "done");
  });

  it("legacy status mapping covers the old vocabulary", () => {
    assert.equal(legacyStatusOf({ ...base, paymentState: "unpaid" }), "pending_payment");
    assert.equal(legacyStatusOf({ ...base, paymentState: "paid" }), "paid");
    assert.equal(legacyStatusOf(base), "accepted");
    assert.equal(legacyStatusOf({ ...base, fulfillmentState: "ready" }), "ready_for_pickup");
    assert.equal(legacyStatusOf({ ...base, orderState: "cancelled", paymentState: "refunded" }), "refunded");
  });
});
