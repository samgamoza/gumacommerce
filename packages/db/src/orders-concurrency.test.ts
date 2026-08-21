/**
 * Integration test: concurrent checkout must never oversell.
 *
 * This is a REAL database test, not a mocked one — the bug it guards against
 * (two checkouts both passing an unlocked stock check) only exists at the
 * database isolation level and cannot be reproduced against a fake repository.
 *
 * Setup (one time):
 *   pnpm db:up                                  # docker-compose postgres on :5434
 *   $env:DATABASE_URL="postgres://postgres:postgres@localhost:5434/guma_commerce"
 *   pnpm --filter @guma-commerce/db exec drizzle-kit migrate
 *
 * Run:
 *   $env:DATABASE_URL="postgres://postgres:postgres@localhost:5434/guma_commerce"
 *   pnpm --filter @guma-commerce/db exec tsx --test src/orders-concurrency.test.ts
 *
 * SAFETY: this test writes and deletes rows. It hard-refuses to run against a
 * Neon/production URL — see the guard below. Never point DATABASE_URL at
 * production to run it.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "./client";
import { OrderError, createOrderForTenant } from "./queries/orders";
import { customers, orders, productVariants, products, tenants } from "./schema/index";

const url = process.env.DATABASE_URL ?? "";

// --- Safety guard: never run destructive tests against a hosted/production DB ---
if (/neon\.tech|neon\.database|amazonaws|supabase|render\.com/i.test(url)) {
  throw new Error(
    "Refusing to run destructive concurrency tests against a hosted database. " +
      "Point DATABASE_URL at the local docker-compose Postgres (pnpm db:up)."
  );
}
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Start local Postgres with `pnpm db:up` and set " +
      "DATABASE_URL=postgres://postgres:postgres@localhost:5434/guma_commerce"
  );
}

const db = getDb();
const slug = `test-oversell-${randomUUID().slice(0, 8)}`;
let tenantId = "";
let productId = "";
let variantId = "";

async function seedOneUnitInStock() {
  const [tenant] = await db
    .insert(tenants)
    .values({ slug, name: "Oversell Test Shop" })
    .returning();
  tenantId = tenant!.id;

  const [product] = await db
    .insert(products)
    .values({
      tenantId,
      title: "Last One Left",
      slug: "last-one-left",
      status: "active",
      basePrice: "100.00",
      trackInventory: true,
    })
    .returning();
  productId = product!.id;

  const [variant] = await db
    .insert(productVariants)
    .values({
      productId,
      sku: `${slug}-default`,
      title: "Regular",
      price: "100.00",
      stockQty: 1,
    })
    .returning();
  variantId = variant!.id;
}

function placeOrder(buyer: string) {
  return createOrderForTenant({
    tenantSlug: slug,
    items: [{ productId, quantity: 1 }],
    customer: { name: buyer, phone: `+639${Math.floor(100000000 + Math.random() * 899999999)}` },
    deliveryType: "pickup",
    paymentMethod: "cod",
    deliveryFee: 0,
    minOrderAmount: 0,
  });
}

describe("createOrderForTenant — concurrent stock safety", () => {
  before(seedOneUnitInStock);

  after(async () => {
    // FK order matters: orders (cascades items + status history) → customers
    // (orders.customer_record_id references it) → variants → products → tenant.
    await db.delete(orders).where(eq(orders.tenantId, tenantId));
    await db.delete(customers).where(eq(customers.tenantId, tenantId));
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
    await db.delete(products).where(eq(products.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    await closeDb();
  });

  it("sells the last unit exactly once when two buyers race", async () => {
    // Fire both without awaiting in between — they overlap inside Postgres.
    const [a, b] = await Promise.allSettled([placeOrder("Buyer A"), placeOrder("Buyer B")]);

    const fulfilled = [a, b].filter((r) => r.status === "fulfilled");
    const rejected = [a, b].filter((r) => r.status === "rejected");

    assert.equal(
      fulfilled.length,
      1,
      `expected exactly 1 successful order, got ${fulfilled.length} (oversell!)`
    );
    assert.equal(rejected.length, 1, "expected exactly 1 rejected order");

    const error = (rejected[0] as PromiseRejectedResult).reason;
    assert.ok(error instanceof OrderError, `expected OrderError, got ${error?.constructor?.name}`);
    assert.equal(error.code, "OUT_OF_STOCK");
  });

  it("leaves stock at zero, never negative", async () => {
    const [variant] = await db
      .select({ stockQty: productVariants.stockQty })
      .from(productVariants)
      .where(eq(productVariants.id, variantId));

    assert.equal(variant?.stockQty, 0, "stock should be exactly 0 after one sale of one unit");
  });

  it("rolls the losing order back completely — no orphan order row", async () => {
    const rows = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.tenantId, tenantId));

    assert.equal(rows.length, 1, "the failed checkout must not leave an order row behind");
  });
});
