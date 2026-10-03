# Phase 2 — Core alignment: migration spec (for review)

Status: **approved 2026-10-03 with the recommended D1–D5; implemented** — see `docs/PHASE-2-NOTES-2026-10-03.md`.
Date: 2026-10-03. Builds on Phase 1 (migrations 0018–0020).

Scope from plan §4/§6/§11: three statuses + migration, locations (default only), stock ledger (done in 0020),
payment rows for all methods, outbox relay, `message_log`, consent fields.
Exit criterion: **the existing store checkout runs on the new core without regressions.**

---

## 1. Decisions I need from you (everything else below is my recommendation)

| # | Question | My recommendation |
|---|---|---|
| D1 | Keep a merchant "Accept order" step? The new model has no `accepted`/`preparing` states. | Keep it as a timestamp, `orders.accepted_at`, not a state. The dashboard's *To pack* = paid/cod_due + unfulfilled. "Accept" sets `accepted_at` and is optional. |
| D2 | After a buyer texts STOP, do **order updates** (payment confirmed, out for delivery) still go out? | Yes. STOP blocks recovery and reminder messages only. Order updates are service messages the buyer needs. The checkout consent copy says so. |
| D3 | STOP scope: one shop, or every Guma Kart shop? | Every shop. SMS go out under one platform sender name, so a STOP can't be traced to a single shop. |
| D4 | Where does "unpaid orders expire after N hours" live per merchant? | `tenants.settings_json.checkout.unpaidExpiryHours` (default 24, allowed range 1–72). The cron reads it per shop. |
| D5 | When do the old columns (`orders.status`, `orders.payment_status`) get dropped? | One release after the cut-over, once a week of verification queries comes back clean (§7, step 5). |

---

## 2. Target model

### 2.1 Order: three independent statuses

| `order_state` | `payment_state` | `fulfillment_state` |
|---|---|---|
| `open` | `unpaid` | `unfulfilled` |
| `completed` | `pending_verification` — buyer sent proof or a reference | `ready` — packed, or ready for pickup |
| `cancelled` | `paid` | `booked` — provider accepted |
| | `cod_due` | `picked_up` — courier has it |
| | `failed` | `out_for_delivery` |
| | `refunded` | `delivered` (also used for buyer pickup and POS) |
| | `partially_refunded` (enum value only; logic in V1.1) | `failed_delivery` |
| | | `returned` |

New columns on `orders`: `order_state`, `payment_state`, `fulfillment_state`, `accepted_at`, `cancelled_at`,
`cancel_reason`, `location_id`.

`delivery_type` gains `in_store` for POS in Phase 5. `source_channel` becomes a checked set: `storefront`,
`checkout_link`, `pos`, `messenger`, `manual`, `api`.

**Invariants.** Enforced in `orderService.transition()`; the two marked (DB) are also CHECK constraints.
1. (DB) `order_state = 'completed'` ⇒ `payment_state = 'paid'` AND `fulfillment_state = 'delivered'`.
2. (DB) `order_state = 'cancelled'` ⇒ the goods aren't in transit (`picked_up`/`out_for_delivery`), and `delivered` only
   when the payment was refunded (a refund after delivery closes the order).
3. `payment_state = 'cod_due'` only when `payment_method = 'cod'`.
4. Cancel is allowed while fulfillment is `unfulfilled`, `ready` or `booked`. Cancelling a `booked` order also cancels the
   courier booking. A paid cancel goes through the refund flow; this is the Phase 1 rule, unchanged.
5. An order becomes **completed** automatically when it is both paid and delivered. COD moves `cod_due → paid` on `delivered`.

### 2.2 Transitions (one service, one transaction each)

`orderService.transition(orderId, action, ctx)`. Each action takes a `FOR UPDATE` row lock, checks the rules,
writes the new states, writes `order_status_history`, applies stock and money side effects, and writes an **outbox event**,
all in **one transaction**. Phase 1's `transitionOrderStatus` and `refundOrder` become thin wrappers around it.

| Action | From → to | Side effects | Outbox event |
|---|---|---|---|
| `create` | — → open/unpaid (or open/cod_due)/unfulfilled | stock `sale`, payment row (§2.4) | `Order.Created.V2` |
| `submit_payment_proof` | unpaid → pending_verification | payment row → processing | `Order.PaymentSubmitted.V1` |
| `confirm_payment` (seller, or PayMongo webhook) | unpaid / pending_verification → paid | payment row → paid, wallet credit (pending) | `Order.PaymentConfirmed.V1` (+ legacy `Order.PaymentSucceeded.V1`) |
| `reject_payment_proof` | pending_verification → unpaid | — | `Order.PaymentRejected.V1` |
| `accept` | sets `accepted_at` | — | `Order.Accepted.V1` |
| `mark_ready` | unfulfilled → ready | — | `Fulfillment.Ready.V1` |
| `fulfillment_update` (courier webhook, forward-only) | ready/unfulfilled → booked → picked_up → out_for_delivery → delivered; any → failed_delivery / returned | on delivered: COD → paid + cod payment row, wallet release; auto-complete | `Fulfillment.<Status>.V1` |
| `cancel` | open → cancelled | restock (if goods not out), cancel courier booking, refund flow if paid | `Order.Cancelled.V1` |
| `expire` (system) | open/unpaid → cancelled | restock | `Order.Expired.V1` |
| `refund` | paid → refunded, order → cancelled (refused while in transit) | NOWAIT lock, gateway once, restock if not out, wallet reverse | `Order.Refunded.V1` |

During the cut-over the service also writes the **legacy** `status`/`payment_status` (dual-write, §7) using one
function, `legacyStatusOf(order)`, so every existing reader keeps working until it is moved.

### 2.3 Locations (default only in V1)

```
locations(id, tenant_id → tenants, name, address_line, barangay, city, province, psgc_code,
          lat, lng, phone, is_default bool, is_active bool, created_at, updated_at)
  unique (tenant_id) where is_default
```
- Back-fill one default location per tenant from `settings.delivery.pickupAddress`. The coordinates are geocoded lazily on the next quote.
- `orders.location_id`, `stock_movements.location_id`, `deliveries.pickup_location_id` all point at it.
  Back-filled to the tenant default.
- **Stock stays on `product_variants.stock_qty`** (single location). Per-location stock (`inventory_levels`) waits for
  multi-location in V1.1, which keeps Phase 2 small. POS Lite (Phase 5) needs locations to exist, not per-location stock.

### 2.4 Payment rows for every method

Every order has exactly one **active** charge row from creation, so "who owes what" is always a query, not inference.

| Method | Row at creation | Later |
|---|---|---|
| COD | gateway `cod`, status `pending` (amount due) | `paid` on delivered (Phase 1 already inserts it then. Now it's created up front and updated.) |
| Manual GCash/Maya/bank | gateway `manual`, `pending` | `processing` on proof, `paid` on seller confirm |
| PayMongo | gateway `paymongo`, `pending`, intent/session id | `paid` / `failed` via webhook |

New columns on `payment_transactions`: `reference` (buyer reference no.), `proof_url`, `verified_by → users`,
`verified_at`, `checkout_url`, `refund_id`, `refunded_at`, `failure_reason`. These move out of `raw_webhook_json`, and the
back-fill copies them. Constraint: `unique (order_id) where status in ('pending','processing','paid')`, at most one live charge.

### 2.5 Outbox + relay

`domain_events` already exists and has the idempotency key, but events are emitted *after* commit, straight to Inngest.
If that send fails, the event is lost.

- Add to `domain_events`: `published_at`, `attempts int default 0`, `next_attempt_at`, `last_error`.
  Index `(next_attempt_at) where published_at is null`.
- `orderService.transition()` inserts the event row **inside** the transaction.
- Relay: after commit, a best-effort immediate publish. A cron every minute (Cloudflare Cron Trigger / Vercel cron)
  then publishes unpublished rows to Inngest with `id = idempotency_key`, so Inngest dedupes. Backoff runs 1m → 5m → 30m → 2h,
  and the relay gives up after 10 attempts and alerts.
- Consumers stay Inngest functions (Phase 4 recipes).

### 2.6 `message_log` (every send, every channel)

```
message_log(id, tenant_id, order_id?, customer_id?, channel ('sms','messenger','email','push'),
            recipient (E.164 / address), recipe (e.g. 'order_created'), step int,
            idempotency_key unique  -- `${recipe}:${entityId}:${step}`,
            status ('queued','sent','delivered','failed','suppressed'), suppressed_reason,
            provider, provider_message_id, body, segments int, cost_centavos int,
            error, created_at, sent_at, delivered_at)
  index (tenant_id, created_at), (order_id), (recipient, created_at)
```
Phase 2 only creates the table and routes the **existing** inline SMS (checkout confirmation, seller alerts) through a
`sendMessage()` that writes it. Phase 4 adds the recipes.

### 2.7 Consent

- `customers`: `sms_marketing_opt_in bool default false`, `sms_opt_in_at`, `sms_opt_in_source`.
- `checkout_sessions`: `phone`, `marketing_consent bool`, `recovery_sent_count int default 0`, `last_recovery_at`,
  `source_channel`, `utm_json`.
- `messaging_opt_outs(phone E.164, channel, scope ('marketing','all'), tenant_id null = platform-wide, source ('STOP','admin'), created_at)`,
  unique `(phone, channel, scope, coalesce(tenant_id, …))`.
- Checkout adds an unticked "Send me reminders about this order" checkbox and quiet hours (9pm–8am) for recovery messages, as in §8.

---

## 3. Mapping existing orders (back-fill)

Inputs: `status`, `payment_status`, `payment_method`, latest `deliveries` row, latest `payment_transactions` row.

| Legacy `status` | `order_state` | `payment_state` | `fulfillment_state` | `accepted_at` |
|---|---|---|---|---|
| `pending_payment` | open | `pending_verification` if a txn is `processing`, else `unpaid` (COD can't be here) | unfulfilled | — |
| `paid` | open | paid | unfulfilled | — |
| `accepted` | open | paid if `payment_status='paid'`; COD → `cod_due`; else unpaid | unfulfilled, or `booked` if there's an active delivery row | first `accepted` history row, else `created_at` |
| `preparing` | open | as above | as above | as above |
| `ready_for_pickup` | open | as above | ready | as above |
| `out_for_delivery` | open | as above | out_for_delivery (`picked_up` if the delivery row has `picked_up_at` but status isn't on-the-way yet) | as above |
| `delivered` | completed | paid (old COD rows from before Phase 1 also become paid; delivered COD means collected) | delivered | as above |
| `cancelled` | cancelled | paid if `payment_status='paid'` (late payment → still needs refund), else unpaid/failed as stored | unfulfilled | — |
| `refunded` | cancelled | refunded | delivered if it was delivered before the refund (from history), else unfulfilled | — |

Every row also gets a payment row if it lacks one (§2.4), `location_id = tenant default`, and
`source_channel` normalized (`null` → `storefront`).

**Round-trip check:** `legacyStatusOf(backfilled) = original status` must hold for every row (§6 test 1).

---

## 4. Migrations

| File | Kind | Content | Locking / risk |
|---|---|---|---|
| `0021_phase2_expand` | additive | new enums; nullable new columns on `orders`, `payment_transactions`, `domain_events`, `customers`, `checkout_sessions`; `locations`, `message_log`, `messaging_opt_outs` | `ADD COLUMN` without a default → metadata-only; new tables. Safe online. |
| `0022_phase2_backfill` | data | locations per tenant; §3 mapping via `UPDATE … FROM` in one statement per table; payment rows; field copies from `raw_webhook_json` | Check `select count(*) from orders` first: below ~200k rows a single transaction is fine, above that batch it by `created_at`. Written idempotently (`WHERE order_state IS NULL`), so it can re-run. |
| *(app release A)* | code | `orderService` dual-writes old + new; readers still on old | rollback = previous build (old columns are still maintained) |
| *(app release B)* | code | readers move to the new columns (list below); outbox relay on; `sendMessage` + `message_log` | rollback = release A |
| `0023_phase2_constrain` | DDL | `SET NOT NULL` + defaults on the three states, CHECK invariants (§2.1), unique live-charge index, `unique default location` | Run only after verification query V1 (§6) returns 0 rows. `SET NOT NULL` scans once; fine at this size. |
| `0024_phase2_contract` (a later release) | destructive | drop `orders.status`, `orders.payment_status`, the `order_status` enum, legacy event emitters | One release after B with a clean week. Irreversible — take a Neon branch snapshot first. |

`order_status_history.status` (old enum) → becomes `event varchar` + `from_state`/`to_state` text in 0021; old rows are kept as-is.

## 5. Code that moves to the new columns (release B)

From the Phase 1 audit, 20 files read `orders.status`/`OrderStatus`:

- **db:** `order-lifecycle.ts`, `orders.ts`, `manual-payments.ts`, `deliveries.ts`, `customers.ts`, `platform.ts`,
  `plan-billing.ts`, `types/tenant-settings.ts`, `order-status.ts`, `index.ts`.
- **admin:** `orders-manager.tsx` (tabs become *To pay · To confirm · To pack · To ship · Shipping · Done*),
  `api/orders/[orderId]/route.ts` (PATCH takes **actions**, not statuses), `settings/notifications-settings.tsx`,
  `api/settings/route.ts`.
- **web:** order tracking page (timeline built from the triple), Lalamove/Grab/BayanGo webhooks
  (`fulfillment_update`; BayanGo's richer statuses now map 1:1: assigned → booked, picked_up, failed_delivery, returned).
- **platform:** orders list and stats.

## 6. Verification and tests

**Tests (written before the code, against the local Postgres):**
1. Back-fill round trip: seed one order per legacy status × payment method × delivery combination, run 0022,
   assert §3 for each and `legacyStatusOf` = original.
2. Transition matrix: every (state triple × action) is either allowed with the exact resulting triple or rejected; the
   invariants hold after every allowed one (generated, not hand-listed).
3. All Phase 1 lifecycle tests ported to actions: cancel races, refund NOWAIT, expiry, late payment, COD.
4. Outbox: an event row exists iff the transition committed (rollback test); the relay publishes once with the
   idempotency key; a failed publish retries with backoff.
5. Payment rows: exactly one live charge per order after create / proof / confirm / refund.
6. Checkout regression: storefront COD, manual GCash, PayMongo (mocked) end to end produce the same buyer-visible
   result as today.

**Verification queries (production, after 0022 and daily during the dual-write week):**
- V1: orders where any of the three states is null → must be 0.
- V2: `legacyStatusOf(new) <> status` → must be 0 (dual-write drift).
- V3: completed orders not paid+delivered → 0. V4: orders with ≠ 1 live charge row → 0.
- V5: `sum(stock_movements.delta)` vs `stock_qty` per variant since the ledger opening balance → 0 mismatches.

## 7. Cut-over sequence

1. Neon branch snapshot → apply 0021 + 0022 → run V1 to V5.
2. Deploy release A (dual-write). Run V2 daily.
3. Deploy release B (readers + outbox + message_log). Smoke: one order of each payment method on production.
4. Apply 0023 when V1/V2 are clean.
5. After a clean week: 0024 (contract) in its own release.

## 8. Out of scope for Phase 2

Checkout Links (Phase 3), SMS recipes (Phase 4), POS (Phase 5), per-location stock, partial refunds,
merchant-facing stock-history UI (the API exists since 0020).

## 9. Estimate

About 2 weeks for one developer, matching the plan: about 3 days for migrations and back-fill with tests, 4 days for the service,
dual-write and the transition tests, 3 days to move the readers and the admin order tabs, 2 days for the outbox relay,
`message_log`, consent and the checkbox, plus buffer.
