/**
 * Phase 2 integration tests (local Postgres only — see orders-concurrency.test.ts).
 *   - 0022 back-fill maps every legacy shape correctly and round-trips
 *   - outbox: event iff commit, relay publishes once, retries with backoff
 *   - exactly one live charge row per order
 *   - per-shop unpaid expiry window (decision D4)
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { closeDb, getDb } from "./client";
import { applyOrderAction, expireUnpaidOrders } from "./queries/order-lifecycle";
import { createOrderForTenant, OrderError } from "./queries/orders";
import { confirmManualOrderPayment, recordManualPaymentIntent, submitManualPaymentReference } from "./queries/manual-payments";
import { relayOutbox } from "./queries/outbox";
import { addOptOut, sendWithLog } from "./queries/message-log";
import { legacyPaymentStatusOf, legacyStatusOf } from "./queries/order-state";
import {
  customers,
  deliveries,
  domainEvents,
  locations,
  messageLog,
  messagingOptOuts,
  orderStatusHistory,
  orders,
  paymentTransactions,
  productVariants,
  products,
  tenantWallets,
  tenants,
  walletLedgerEntries,
} from "./schema/index";

const url = process.env.DATABASE_URL ?? "";
if (/neon\.tech|neon\.database|amazonaws|supabase|render\.com/i.test(url)) {
  throw new Error("Refusing to run destructive tests against a hosted database.");
}
if (!url) throw new Error("DATABASE_URL is not set (use the local Postgres on :5434).");

const here = path.dirname(fileURLToPath(import.meta.url));
const db = getDb();
const slug = `test-p2-${randomUUID().slice(0, 8)}`;
let tenantId = "";
let productId = "";

function place(paymentMethod: "cod" | "gcash", quantity = 1) {
  return createOrderForTenant({
    tenantSlug: slug,
    items: [{ productId, quantity }],
    customer: { name: "P2 Buyer", phone: `+639${Math.floor(100000000 + Math.random() * 899999999)}` },
    deliveryType: "delivery",
    paymentMethod,
    deliveryFee: 0,
    minOrderAmount: 0,
  });
}

async function row(id: string) {
  const [o] = await db.select().from(orders).where(eq(orders.id, id));
  return o!;
}

async function liveCharges(orderId: string) {
  return db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.orderId, orderId),
        inArray(paymentTransactions.status, ["pending", "processing", "paid"])
      )
    );
}

before(async () => {
  const [tenant] = await db
    .insert(tenants)
    .values({ slug, name: "Phase 2 Shop", settingsJson: { delivery: { pickupAddress: "12 Rizal Ave, Puerto Princesa" } } })
    .returning();
  tenantId = tenant!.id;
  const [product] = await db
    .insert(products)
    .values({ tenantId, title: "Turon", slug: "turon", status: "active", basePrice: "25.00", trackInventory: true })
    .returning();
  productId = product!.id;
  await db.insert(productVariants).values({ productId, sku: `${slug}-v`, title: "Pc", price: "25.00", stockQty: 500 });
});

after(async () => {
  const orderIds = db.select({ id: orders.id }).from(orders).where(eq(orders.tenantId, tenantId));
  await db.delete(domainEvents).where(eq(domainEvents.tenantId, tenantId));
  await db.delete(messageLog).where(eq(messageLog.tenantId, tenantId));
  await db.delete(messagingOptOuts).where(sql`${messagingOptOuts.phone} like '0999000%'`);
  await db.delete(walletLedgerEntries).where(eq(walletLedgerEntries.tenantId, tenantId));
  await db.delete(tenantWallets).where(eq(tenantWallets.tenantId, tenantId));
  await db.delete(deliveries).where(sql`${deliveries.orderId} in ${orderIds}`);
  await db.delete(paymentTransactions).where(eq(paymentTransactions.tenantId, tenantId));
  await db.delete(orderStatusHistory).where(sql`${orderStatusHistory.orderId} in ${orderIds}`);
  await db.delete(orders).where(eq(orders.tenantId, tenantId));
  await db.delete(customers).where(eq(customers.tenantId, tenantId));
  await db.delete(productVariants).where(eq(productVariants.productId, productId));
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(locations).where(eq(locations.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  await closeDb();
});

describe("0022 back-fill", () => {
  type Legacy = {
    status: "pending_payment" | "paid" | "accepted" | "preparing" | "ready_for_pickup" | "out_for_delivery" | "delivered" | "cancelled" | "refunded";
    paymentStatus: "pending" | "paid" | "refunded" | "failed";
    method: "cod" | "gcash";
    processingTxn?: boolean;
    bookedDelivery?: boolean;
    expect: [string, string, string];
  };
  const cases: Legacy[] = [
    { status: "pending_payment", paymentStatus: "pending", method: "gcash", expect: ["open", "unpaid", "unfulfilled"] },
    { status: "pending_payment", paymentStatus: "pending", method: "gcash", processingTxn: true, expect: ["open", "pending_verification", "unfulfilled"] },
    { status: "paid", paymentStatus: "paid", method: "gcash", expect: ["open", "paid", "unfulfilled"] },
    { status: "accepted", paymentStatus: "pending", method: "cod", expect: ["open", "cod_due", "unfulfilled"] },
    { status: "accepted", paymentStatus: "paid", method: "gcash", bookedDelivery: true, expect: ["open", "paid", "booked"] },
    { status: "preparing", paymentStatus: "pending", method: "cod", expect: ["open", "cod_due", "unfulfilled"] },
    { status: "ready_for_pickup", paymentStatus: "paid", method: "gcash", expect: ["open", "paid", "ready"] },
    { status: "out_for_delivery", paymentStatus: "pending", method: "cod", expect: ["open", "cod_due", "out_for_delivery"] },
    { status: "delivered", paymentStatus: "pending", method: "cod", expect: ["completed", "paid", "delivered"] },
    { status: "delivered", paymentStatus: "paid", method: "gcash", expect: ["completed", "paid", "delivered"] },
    { status: "cancelled", paymentStatus: "pending", method: "gcash", expect: ["cancelled", "unpaid", "unfulfilled"] },
    { status: "cancelled", paymentStatus: "paid", method: "gcash", expect: ["cancelled", "paid", "unfulfilled"] },
    { status: "refunded", paymentStatus: "refunded", method: "gcash", expect: ["cancelled", "refunded", "unfulfilled"] },
  ];

  it("maps every legacy shape and the legacy columns round-trip", async () => {
    const ids: string[] = [];
    for (const [i, c] of cases.entries()) {
      // A row exactly as the pre-Phase-2 code wrote it: no new columns.
      const [o] = await db
        .insert(orders)
        .values({
          tenantId,
          orderNumber: `LEG-${slug}-${i}`,
          status: c.status,
          paymentStatus: c.paymentStatus,
          paymentMethod: c.method,
          subtotal: "100.00",
          total: "100.00",
        })
        .returning();
      ids.push(o!.id);
      await db.insert(orderStatusHistory).values({ orderId: o!.id, status: c.status });
      if (c.processingTxn) {
        await db.insert(paymentTransactions).values({
          orderId: o!.id,
          tenantId,
          gateway: "manual",
          gatewayIntentId: `manual_${o!.id}`,
          amount: "100.00",
          status: "processing",
          rawWebhookJson: { buyerReference: "GC-LEGACY-1", proofUrl: "/uploads/payment-proofs/x/y/z.png" },
        });
      }
      if (c.bookedDelivery) {
        await db.insert(deliveries).values({ orderId: o!.id, provider: "lalamove", providerOrderId: `ll_${i}`, status: "ASSIGNING_DRIVER" });
      }
    }

    const file = readFileSync(path.join(here, "../drizzle/0022_phase2_backfill.sql"), "utf8");
    for (const stmt of file.split("--> statement-breakpoint")) {
      if (stmt.trim()) await db.execute(sql.raw(stmt));
    }
    // Idempotent: a second run changes nothing.
    for (const stmt of file.split("--> statement-breakpoint")) {
      if (stmt.trim()) await db.execute(sql.raw(stmt));
    }

    for (const [i, c] of cases.entries()) {
      const o = await row(ids[i]!);
      assert.deepEqual(
        [o.orderState, o.paymentState, o.fulfillmentState],
        c.expect,
        `case ${i} (${c.status}/${c.paymentStatus}/${c.method})`
      );
      const facts = {
        orderState: o.orderState!,
        paymentState: o.paymentState!,
        fulfillmentState: o.fulfillmentState!,
        accepted: o.acceptedAt != null,
      };
      // The SQL CASE in 0022 and legacyStatusOf() must agree (V2 drift check).
      assert.equal(o.status, legacyStatusOf(facts), `legacy status, case ${i}`);
      assert.equal(o.paymentStatus, legacyPaymentStatusOf(facts.paymentState), `legacy payment, case ${i}`);
      // Only intended rewrites of the old value.
      const expectedLegacy = c.status === "preparing" ? "accepted" : c.status;
      assert.equal(o.status, expectedLegacy, `case ${i} keeps its legacy status`);
      assert.ok(o.locationId, "default location assigned");
      const charges = await db.select().from(paymentTransactions).where(eq(paymentTransactions.orderId, o.id));
      assert.equal(charges.length, 1, `exactly one payment row, case ${i}`);
    }

    const [proofRow] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.orderId, ids[1]!));
    assert.equal(proofRow!.reference, "GC-LEGACY-1", "reference copied out of raw_webhook_json");
    const [loc] = await db.select().from(locations).where(and(eq(locations.tenantId, tenantId), eq(locations.isDefault, true)));
    assert.equal(loc!.addressLine, "12 Rizal Ave, Puerto Princesa");
  });
});

describe("outbox", () => {
  it("writes an event only when the change commits, and the relay publishes it once", async () => {
    const order = await place("cod");
    const created = await db
      .select()
      .from(domainEvents)
      .where(and(eq(domainEvents.tenantId, tenantId), eq(domainEvents.eventName, "Order.Created.V2"), sql`${domainEvents.payloadJson}->'data'->>'orderId' = ${order.id}`));
    assert.equal(created.length, 1);
    assert.equal(created[0]!.publishedAt, null, "waits for the relay");

    // A rejected action leaves no event behind.
    const countBefore = await db.select({ n: sql<number>`count(*)::int` }).from(domainEvents).where(eq(domainEvents.tenantId, tenantId));
    await assert.rejects(
      applyOrderAction({ orderId: order.id, tenantId, action: { type: "confirm_payment" }, source: "buyer" }),
      (e: unknown) => e instanceof OrderError
    );
    const countAfter = await db.select({ n: sql<number>`count(*)::int` }).from(domainEvents).where(eq(domainEvents.tenantId, tenantId));
    assert.equal(countAfter[0]!.n, countBefore[0]!.n);

    const published: string[] = [];
    const first = await relayOutbox(async (r) => {
      if (r.tenantId === tenantId) published.push(r.idempotencyKey);
    }, { limit: 500 });
    assert.ok(first.published >= 1);
    assert.ok(published.includes(`Order.Created.V2:${order.id}`));
    const again: string[] = [];
    await relayOutbox(async (r) => {
      if (r.tenantId === tenantId) again.push(r.idempotencyKey);
    }, { limit: 500 });
    assert.deepEqual(again, [], "nothing is published twice");
  });

  it("retries failed publishes with backoff", async () => {
    const order = await place("cod");
    await applyOrderAction({ orderId: order.id, tenantId, action: { type: "accept" }, source: "seller" });
    const now = new Date();
    const failed = await relayOutbox(async (r) => {
      if (r.tenantId === tenantId) throw new Error("inngest down");
    }, { limit: 500, now });
    assert.ok(failed.failed >= 1);
    const pending = await db
      .select()
      .from(domainEvents)
      .where(and(eq(domainEvents.tenantId, tenantId), isNull(domainEvents.publishedAt)));
    assert.ok(pending.length >= 1);
    assert.ok(pending.every((e) => e.attempts === 1 && e.nextAttemptAt && e.nextAttemptAt > now));

    const tooSoon = await relayOutbox(async () => {}, { limit: 500, now });
    assert.equal(tooSoon.published, 0, "waits for the backoff");
    const later = await relayOutbox(async () => {}, { limit: 500, now: new Date(now.getTime() + 2 * 60_000) });
    assert.ok(later.published >= pending.length);
  });
});

describe("payment rows", () => {
  it("every order keeps exactly one live charge through its life", async () => {
    const cod = await place("cod");
    assert.equal((await liveCharges(cod.id)).length, 1, "COD has its charge row at creation");
    await applyOrderAction({ orderId: cod.id, action: { type: "fulfillment_update", to: "delivered" }, source: "courier" });
    const codRows = await liveCharges(cod.id);
    assert.equal(codRows.length, 1);
    assert.equal(codRows[0]!.status, "paid");

    const manual = await place("gcash");
    await recordManualPaymentIntent({ orderId: manual.id, tenantId, amount: manual.total, methodType: "gcash", orderNumber: manual.orderNumber });
    await submitManualPaymentReference({ tenantId, orderId: manual.id, reference: "GC-777", proofUrl: "/uploads/payment-proofs/a/b/c.png" });
    let rows = await liveCharges(manual.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.status, "processing");
    assert.equal(rows[0]!.reference, "GC-777");
    assert.equal((await row(manual.id)).paymentState, "pending_verification");

    await confirmManualOrderPayment({ tenantId, orderId: manual.id });
    rows = await liveCharges(manual.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.status, "paid");
    assert.ok(rows[0]!.verifiedAt, "seller verification recorded");
  });
});

describe("per-shop unpaid expiry (D4)", () => {
  it("uses the shop's own window", async () => {
    const order = await place("gcash");
    await db.update(orders).set({ createdAt: new Date(Date.now() - 2 * 3600_000) }).where(eq(orders.id, order.id));

    await db.update(tenants).set({ settingsJson: sql`jsonb_set(coalesce(${tenants.settingsJson}, '{}'::jsonb), '{checkout}', '{"unpaidExpiryHours": 72}')` }).where(eq(tenants.id, tenantId));
    const notYet = await expireUnpaidOrders();
    assert.ok(!notYet.orderIds.includes(order.id), "72h window: a 2h-old order stays open");

    await db.update(tenants).set({ settingsJson: sql`jsonb_set(${tenants.settingsJson}, '{checkout}', '{"unpaidExpiryHours": 1}')` }).where(eq(tenants.id, tenantId));
    const expired = await expireUnpaidOrders();
    assert.ok(expired.orderIds.includes(order.id), "1h window: expired");
    assert.equal((await row(order.id)).orderState, "cancelled");
  });
});

describe("message log + opt-outs", () => {
  const phone = `0999000${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const entity = randomUUID();
  // Getter: tenantId is only known after the top-level before() runs.
  const b = () => ({
    tenantId,
    channel: "sms" as const,
    recipient: phone,
    entityId: entity,
    provider: "semaphore",
  });

  it("sends once per recipe/order/step and records the result", async () => {
    let sends = 0;
    const send = async () => {
      sends += 1;
      return { success: true, messageId: "sem_1" };
    };
    const first = await sendWithLog({ ...b(), recipe: "order_created", body: "Order received", kind: "transactional" }, send);
    const replay = await sendWithLog({ ...b(), recipe: "order_created", body: "Order received", kind: "transactional" }, send);
    assert.equal(first.status, "sent");
    assert.equal(replay.status, "duplicate");
    assert.equal(sends, 1, "the provider is called once");
    const [row] = await db.select().from(messageLog).where(eq(messageLog.idempotencyKey, `order_created:${entity}:0`));
    assert.equal(row!.status, "sent");
    assert.equal(row!.providerMessageId, "sem_1");
    assert.equal(row!.segments, 1);
  });

  it("records provider failures without throwing", async () => {
    const res = await sendWithLog(
      { ...b(), recipe: "order_shipped", body: "On the way", kind: "transactional" },
      async () => {
        throw new Error("semaphore 500");
      }
    );
    assert.equal(res.status, "failed");
  });

  it("refuses a reminder without the stop link", async () => {
    await assert.rejects(
      sendWithLog({ ...b(), recipe: "checkout_recovery", body: "Your cart is waiting", kind: "marketing" }, async () => ({ success: true }))
    );
  });

  it("STOP blocks reminders but not order updates; 'all' blocks both", async () => {
    await addOptOut({ phone, scope: "marketing", source: "STOP" });
    let sends = 0;
    const send = async () => {
      sends += 1;
      return { success: true };
    };
    const reminder = await sendWithLog(
      { ...b(), recipe: "checkout_recovery", step: 1, body: "Finish your order https://kart.guma.one/stop/abc.def123456789", kind: "marketing" },
      send
    );
    assert.equal(reminder.status, "suppressed");
    const update = await sendWithLog({ ...b(), recipe: "order_paid", body: "Payment confirmed", kind: "transactional" }, send);
    assert.equal(update.status, "sent", "decision D2: order updates continue after STOP");

    await addOptOut({ phone: `+63${phone.slice(1)}`, scope: "all", source: "admin" });
    const blocked = await sendWithLog({ ...b(), recipe: "order_delivered", body: "Delivered", kind: "transactional" }, send);
    assert.equal(blocked.status, "suppressed", "normalized +63 number matches");
    assert.equal(sends, 1);
  });
});
