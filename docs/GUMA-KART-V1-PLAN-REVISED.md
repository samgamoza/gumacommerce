# Guma Kart V1: Revised Implementation Plan

**Status:** Revised. Owner decisions from 2026-10-02 applied (see §0.1).
**Date:** 2026-10-02
**Based on:**
- The original *Guma Kart V1 Implementation Plan*
- `docs/CURRENT-STATE-AUDIT-2026-10-02.md` (the Guma Kart code)
- `docs/VEYRON-BAYANGO-FIT-AUDIT-2026-10-02.md` (the Veyron POS and BayanGo code)

---

## 0. What changed from the draft, and why

| Draft said | Revised | Reason (from the audits) |
|---|---|---|
| Veyron POS is a P0 launch pillar that "shares the Commerce Core" | **POS moves to V1.1.** It will be built inside the Guma Kart monorepo, porting Veyron's PH logic. | Veyron is Python/Flask with integer IDs and float money, has no API keys, and has no link to Guma. A shared database or two-way sync isn't viable. |
| BayanGo is the default fulfillment provider at launch | **Fulfill is provider-agnostic.** Lalamove, Grab and manual riders run today. BayanGo becomes the preferred provider once it passes a readiness gate (§7). | BayanGo has no partner API, no outbound webhooks, toy pricing and a broken production migration path. |
| "Do not rebuild existing Veyron/BayanGo/page builder/domains/inventory" | **Keep, port and retire** lists (§13), based on what actually exists. | A page builder and custom domains don't exist. Inventory is minimal. |
| One linear order lifecycle | **Three separate statuses: order, payment and fulfillment.** | The linear chain breaks for COD, pickup and POS. |
| "Payments" as one P0 line | **V1 uses merchant-direct payments** (manual GCash/Maya and COD). Platform collection via PayMongo moves to V1.1. | The PayMongo live attach is likely broken, payouts are simulated, and collecting for merchants raises legal and payout obligations. |
| Messenger is a primary channel | **SMS first** (Semaphore, already working). Messenger follows after Meta App Review. | Messenger messages to real customers require App Review plus Business Verification, and a 24-hour messaging window applies. |
| Security not mentioned | **Phase 1 is stabilization** (security and order integrity). | Sellers can self-verify KYC, order pages are guessable, and stock is never restored. Veyron and BayanGo also have critical holes. |
| 8-step onboarding | **4 steps to a shareable link.** Ask for other settings at the moment they're needed. | The success metric is time to first order. |
| "Checkout" undefined | **Checkout Link** is a defined entity (§5). | No such concept exists in the code today. |

### 0.1 Owner decisions (2026-10-02)

| # | Decision | Effect on this plan |
|---|---|---|
| 1 | **Direct payments now. PayMongo as soon as possible.** | V1 ships merchant-direct payment (manual GCash/Maya + COD). Fixing PayMongo becomes its own track that starts right after Phase 1 (§11), instead of waiting for V1.1. |
| 2 | **BayanGo partner API is assigned to Cursor.** Guma prepares the hook. | ✅ Done. The Guma side is built against `docs/BAYANGO-PARTNER-API-CONTRACT.md`: client, adapter, signed webhook, DB enum migration and tests. It stays off until `BAYANGO_ENABLED=true`. A copy of the contract is in the BayanGo repo at `docs/GUMA-KART-PARTNER-API-CONTRACT.md`. |
| 3 | **Veyron stays a separate product. A custom POS inside Guma Kart is the top sign-up driver.** | **POS Lite moves into V1** as Phase 5, built natively in Guma Kart (§12). Veyron gets security fixes only, and no new features that overlap Guma Kart. |
| 4 | **Pricing: use my recommendation, with add-ons and plan-upgrade inclusions.** | See §18. |
| 5 | **Host on Cloudflare Workers, with the option to return to Proxmox later.** | See §19. Yes, a return to Proxmox stays possible if the code keeps to the rules listed there. |

Unchanged from the draft:
- Positioning
- The "sell → process → fulfill → connect" focus
- "Wrap, don't rebuild" for the storefront
- An event-driven automation engine with suppression rules
- Recipes before a builder
- Time to first order as the north-star metric

---

## 1. Positioning (unchanged)

> **Guma Kart helps Philippine businesses sell anywhere, process every order, deliver it, and keep customers updated automatically.**

**Launch line:** *Sell. Fulfill. Connect.* Start with a checkout link. Deliver with one tap. Your customers get updates by SMS. Build a full online store when you're ready.

Avoid naming BayanGo or Veyron in launch copy until they ship inside the product.

---

## 2. V1 scope

### In V1

1. **Guma Checkout Links.** A merchant creates a link for one or more products, shares it anywhere, and the buyer completes a one-page mobile checkout.
2. **Orders.** A unified order inbox (from links and from the store) with clear next actions.
3. **Merchant-direct payments.**
   - GCash or Maya to the merchant's own account, with reference or screenshot proof and one-tap confirmation by the merchant.
   - Cash on delivery (COD).
4. **Fulfill.**
   - One button, "Book delivery", using the existing orchestrator (Lalamove, Grab, manual rider).
   - Pickup at the store.
   - BayanGo is added as soon as it passes its gate.
5. **Automated SMS updates.** Order received, payment confirmed, rider booked, out for delivery, delivered, and abandoned-checkout recovery (with consent).
6. **Customers.** One record per buyer, keyed by phone number, with order history.
7. **Online Store.** The existing storefront stays available as a secondary sales channel; it no longer gates onboarding.
8. **POS Lite.** A cashier screen for physical shops on the same products, stock, customers and orders as online sales (Phase 5, §12).

### Not in V1 (planned)

| Item | When |
|---|---|
| POS Lite (in-store) | **Moved into V1** (Phase 5) |
| PayMongo platform collection and real payouts | PayMongo track starts after Phase 1. Ships when the live test passes and the legal review is done. |
| Messenger / IG DM messaging | V1.1, after Meta approval |
| BayanGo | As soon as its gate passes; can be mid-V1 |
| "MINE" comment-to-checkout automation | V1.2. Needs Meta/TikTok APIs. The `/kart` UI is kept as the design reference. |
| Multi-location, staff roles, promotions table, loyalty, custom domains | P1/P2 |

---

## 3. Phase 1: Stabilize (must happen before any new feature)

### 3.1 Guma Kart security

1. **KYC lock-down.**
   - Remove `wallet.kycVerified` from `PATCH /api/settings`.
   - Stop auto-approving KYC on submit.
   - Hide wallet payouts in V1, since payouts are simulated.
2. **Order access tokens.**
   - Order tracking, `payment-reference` and `payment-proof` require an unguessable token in the link sent to the buyer.
   - Sequential order numbers stay as display numbers only.
3. **Webhook hardening.**
   - The Grab webhook rejects requests when its secret is unset.
   - Verify the Lalamove signature scheme with a real sandbox call.
4. **Reserved slugs.** Reserve `kart`, `preview`, `uploads`, `frontend1`, `*-demo` and `model`. Make the demo-tenant lookup run *after* the database lookup.
5. **Tenant scoping.** Scope the push-subscription `DELETE` to the tenant. Require auth for `?preview=1` drafts.

### 3.2 Guma Kart order integrity

6. **One order service owns all status changes.** Status, payment, stock and wallet changes all go through one module, run inside one transaction, and each emits an event. Remove the bypass paths: the PATCH route setting `paid`/`refunded`, the courier rank map, and the refund route skipping the guard.
7. **Stock correctness.**
   - Restock on cancel, refund and payment failure.
   - Unpaid online orders expire after a configurable time, then restock.
   - Choose the variant deterministically.
   - Add a `stock_movements` ledger.
8. **Refund idempotency.** Use an idempotency key, record the refund before calling the gateway, and reverse the wallet credit inside the same transaction.

### 3.3 Sister products (one-day hotfixes; live exposure today)

9. **Veyron.**
   - Remove `super_admin` from roles a tenant admin can assign.
   - Lock `/debug/routes`.
   - Rate-limit API login.
   - Disable the PayPal stub.
10. **BayanGo.**
    - `accept()` checks the rider is approved and was the one offered the job.
    - Strip PINs from fulfillment lists and send the PIN only to the recipient.
    - Add ownership checks on `GET /deliveries/:id` and `/active`.

**Exit criteria:** an automated test suite proves that the order state machine, stock restore and access rules hold.

---

## 4. Commerce Core decisions

These are binding for V1, so define them before building further.

| Entity | V1 decision |
|---|---|
| **Business** | Keep `tenants`. Move the settings, shipping and checkout JSON toward typed tables over time; no big-bang migration. |
| **Location** | Add a `locations` table with **one default location per business**. It holds the pickup address (structured PSGC + lat/lng) and replaces the free-text `settings.delivery.pickupAddress`. Multi-location is P1. POS will attach to it in V1.1. |
| **Product / Variant** | Keep. Price lives on the variant; `products.base_price` becomes a display field. Make category assignment work, since `category_id` is currently never written. |
| **Inventory** | `product_variants.stock_qty` plus a new `stock_movements` ledger (reason: sale, restock, cancel, adjust, pos_sale). |
| **Customer** | Keep `customers`, keyed by tenant + phone. Retire the unused `orders.customer_id → users` link. Add SMS consent fields (`sms_opt_in`, `opted_in_at`, `source`). |
| **Order** | Add `source_channel` (`checkout_link`, `store`, later `pos`, `social`) and `checkout_link_id`. Record UTM data. |
| **Payment** | `payment_transactions` is the single source of truth for money. `orders.payment_status` is derived from it and updated in the same transaction. Every method gets a row, including COD and manual payments. Manual proof gets its own columns instead of being stored inside `raw_webhook_json`. |
| **Fulfillment** | Rename the concept to a fulfillment record (the existing `deliveries` table plus `type: delivery or pickup`). Provider is any `DeliveryProvider`; add `bayango` to the enum now. Status becomes a normalized enum, with raw courier status kept separately. |
| **Events** | Keep `domain_events`. Make it a real outbox: written in the same transaction, with a relay that publishes to Inngest. Add a `processed_at` column. |
| **Messages** | New `message_log` table: channel, template, recipient, order/checkout reference, status, provider id and error. Every send is logged and deduplicated by an idempotency key. |

---

## 5. Guma Checkout Link (new, central to V1)

**Entity `checkout_links`**
- `id`, `tenant_id`
- `slug`: a short code, giving the URL `kart.guma.one/c/<code>`
- `title`
- `items`: one or more variants with quantity. The buyer can be allowed to change quantity.
- Optional fixed price override and optional coupon
- Delivery options: delivery, pickup, or both
- Payment methods allowed
- `expires_at` (optional), `max_orders` (optional), `active`
- Counters for views, starts and orders

**Merchant flow**
1. Products → **Create checkout link**, or Checkout → New.
2. Pick products and options.
3. Copy the link, show a QR code, or share it.

**Buyer flow (one page, mobile-first)**
- **Order review:** product(s) with thumbnail and price.
- **Contact:** name and mobile number (email optional), plus an SMS consent checkbox.
- **Delivery:** PSGC chained dropdowns, Region → Province → City → Barangay, plus street/landmark. Pickup is the alternative.
- **Fee:** the live delivery quote is shown as its own line *before* the button.
- **Payment:** GCash, Maya or COD cards, with the merchant's COD fee shown if they charge one.
- **Sticky total and button.**
- **On submit:** the existing `createOrderForTenant` runs with `source_channel = checkout_link`.
- **Order page (token link):** pay instructions plus reference/screenshot upload, then the tracker.

**Reuse**
- The `/kart` UI components (checkout, address select, payment picker, tracker) become the production checkout UI, wired to real APIs.
- `createOrderForTenant`, `computeCheckoutTotals`, the PSGC data, manual-payment queries, the delivery quote, and `checkout_sessions` for abandonment.

**Store integration:** the storefront cart checkout uses the same checkout page component. This leaves one checkout implementation, not two.

---

## 6. Order model: three statuses

| Order status | Payment status | Fulfillment status |
|---|---|---|
| `open` | `unpaid` | `unfulfilled` |
| `completed` | `pending_verification` (proof submitted) | `ready` (packed / ready for pickup) |
| `cancelled` | `paid` | `booked` (provider accepted) |
| | `cod_due` | `picked_up` |
| | `failed` | `out_for_delivery` |
| | `refunded` | `delivered` |
| | `partially_refunded` (P1) | `failed_delivery` |
| | | `returned` |

**Rules**
- An order is **completed** when payment is `paid` and fulfillment is `delivered` (or picked up).
- COD: payment moves `cod_due` → `paid` on delivery.
- Cancel is allowed while unfulfilled or booked, and triggers a restock plus a refund flow if the order was paid.
- Unpaid orders expire after N hours (merchant setting, default 24) → cancelled, with restock.
- Every transition goes through `orderService.transition()`, which runs in one transaction with locking, writes history, writes an outbox event, and handles stock and money side effects.

**Migration from the current enum.** Map:
- `pending_payment` → open / unpaid
- `paid` / `accepted` / `preparing` → open + paid, with fulfillment unfulfilled or ready
- `ready_for_pickup` → ready
- `out_for_delivery` / `delivered` → the matching fulfillment status
- `cancelled` / `refunded` → the matching order and payment status

**Merchant-facing labels stay simple:** *To pay · To confirm · To pack · To ship · Shipping · Done*.

---

## 7. Fulfillment

**V1:** the merchant presses **Book delivery** on a paid order or a COD order. Guma quotes all enabled providers and picks the best one according to the merchant's preference (cheapest or fastest). Manual rider and pickup are always available.

**Status sync:** provider webhooks → normalized fulfillment status → event → SMS to the buyer.

Failed or cancelled deliveries surface as a "Needs attention" item, with a rebook action.

**BayanGo readiness gate.** These are work in the BayanGo repo. When all pass, BayanGo becomes the preferred provider in its service areas.

1. Partner API keys and a partner/merchant entity.
2. Server-side quote from coordinates, with zone/rural pricing and a persisted quote ID with expiry.
3. Book, cancel and get endpoints. The fee is priced on the server and the order reference is idempotent.
4. Signed outbound webhooks for every status, with retries. Use the same HMAC format as Guma's `webhook-signature.ts`.
5. `failed_delivery` and `returned` states, plus the recipient PIN sent by SMS.
6. The security fixes from §3.3, migrations repaired, and a real deployment (not a laptop tunnel).
7. A service-area check (`isServiceable`).

Estimated **3–5 developer-weeks**; it can run in parallel with Guma phases 2–4. The Guma-side adapter is about 2–3 days once the API exists.

---

## 8. Messaging and automation

**Engine**
- Domain events go to the outbox, and Inngest functions run the recipes. `step.sleep` handles delays and re-checks the condition before sending.
- Every send goes through a `MessagingProvider` interface (SMS via Semaphore now; Messenger and email later) and is recorded in `message_log`, with an idempotency key of `recipe + entity + step`.

**V1 recipes (SMS)**

| # | Trigger | Condition / suppression | Message |
|---|---|---|---|
| 1 | `order.created` (unpaid, manual pay) | — | "Order received + how to pay + link" |
| 2 | `payment.confirmed` | — | "Payment confirmed, preparing your order" |
| 3 | `fulfillment.booked` | — | "Rider booked + tracking link" |
| 4 | `fulfillment.out_for_delivery` | — | "Out for delivery (+ COD amount)" |
| 5 | `fulfillment.delivered` | — | "Delivered, salamat!" |
| 6 | `checkout.started` with a phone number and consent | Wait 30 min, stop if an order exists; wait 24 h, stop if an order exists or the buyer opted out | Recovery link (maximum 2) |
| 7 | `order.unpaid` reminder | Wait 6 h, stop if paid or cancelled | "Complete your payment" |

**Merchant alerts:** web push plus optional SMS for new orders, payment proof submitted, and delivery failed.

**Compliance:** consent is captured at checkout. Every recovery SMS honours STOP. There are quiet hours (no recovery SMS from 9pm to 8am).

**Messenger:** add as a channel once Meta App Review is approved. Updates sent more than 24 hours after the customer's last message need a message tag or a utility template.

---

## 9. Onboarding: 4 steps to a shareable link

1. **Your business:** name, mobile number, category. Slug is auto-generated.
2. **First product:** name, price, photo, stock. AI can write the description.
3. **How you get paid:** GCash/Maya number and/or COD on or off.
4. **Your checkout link is ready:** copy it, view it, or share to FB/IG/WhatsApp.

**Asked later, at the moment it's needed**
- Pickup address: on the first delivery booking.
- Delivery fees: defaults to a live quote.
- SMS updates: on by default, with consent captured from buyers.
- Online store (the Launch wizard): from a card, "Build your store".

The Launch wizard stays fully available but is no longer forced on first login. The store activates when the merchant publishes it or when their first checkout link is created.

---

## 10. Navigation and dashboard

```text
Overview
SELL        Checkout links · Orders · Products · Customers
FULFILL     Deliveries
AUTOMATE    Messages · Automations
STORE       Online store (Launch / theme / SEO)
SETTINGS    Business · Payments · Delivery · Notifications · Plan
```

- Remove the 9 placeholder pages (Users, Analytics, Integrations, Domains, Workflows, Code, Logs, API, Security) from the navigation.
- Promote Customers, which is currently hidden.
- Make checkout and shipping settings reachable on every plan.
- POS and BayanGo appear only when they ship.

**Dashboard: "What needs me today?"**
- **To do:** To confirm payment (n) · To pack (n) · To book delivery (n) · Delivery problems (n).
- **Today:** sales, orders, and a by-channel split (links vs store).
- **Deliveries:** booked, out for delivery, delivered.
- **Automations:** messages sent, checkouts recovered.

---

## 11. Phases

Durations are rough estimates for a small team (1–2 developers). Re-estimate after Phase 1.

| Phase | Scope | Exit criteria | Est. |
|---|---|---|---|
| **0. Audit** | ✅ Done (the three audit docs) | — | — |
| **1. Stabilize** | §3: security, order service, stock correctness, refund idempotency; Veyron and BayanGo hotfixes | Tests prove state, stock and access rules | 1.5–2 wks |
| **2. Core alignment** | §4 and §6: three statuses and migration, locations (default), stock ledger, payment rows for all methods, outbox relay, message_log, consent fields | Existing store checkout runs on the new core without regressions | 2 wks |
| **3. Checkout Links** | §5: entity, merchant UI, production checkout built from the `/kart` components, token order page, abandonment capture, source tracking | A merchant creates a link, a buyer orders, and the order appears with the correct source | 2–3 wks |
| **4. Automations (SMS)** | §8: Inngest consumers, recipes 1–7, merchant alerts, logs UI | Every recipe fires once, suppression works, and no duplicate sends occur | 1.5–2 wks |
| **5. POS Lite** | §12: registers and shifts, cashier PIN, POS sale onto the shared order, stock and customers, receipt, PH VAT and senior/PWD | A cashier sale updates stock and the customer, the shift closes balanced, and online and POS stock never double-sell | 3–4 wks |
| **6. Navigation, onboarding, dashboard** | §9 and §10, including the POS entry point and online/POS split | A new merchant reaches a shareable link in under 5 minutes | 1.5 wks |
| **7. Beta** | 10–20 merchants: at least one rural or provincial, at least three with a physical shop using POS | Activation, fulfillment and POS metrics tracked weekly | 3–4 wks |
| **Parallel: BayanGo partner API (Cursor)** | §7 gate, in the BayanGo repo | All 7 gate items pass a sandbox test against the Guma hook | 3–5 wks |
| **Parallel: PayMongo** | Fix attach (payment method id + `return_url`) and add a return page. Live ₱1 test for GCash, Maya, QRPh and card. Legal/BSP review of collecting on merchants' behalf, then real payouts. | A live test order is paid and reconciled end to end | 1–2 wks of dev, plus review |
| **Parallel: Cloudflare move** | §19 | admin, platform and crons run on Workers | 1–1.5 wks |
| **V1.1** | Messenger channel, multi-location, staff roles, POS offline mode, BIR OR/SI | — | — |

**Total to beta: about 13–16 weeks** (POS Lite adds about 3–4).

---

## 12. POS Lite (V1, Phase 5): built inside Guma Kart

**Prerequisites from Phase 2:** locations, stock ledger, `source_channel = pos`, payment rows per tender.

**New for POS**
- `registers` / `register_sessions` (shifts with expected vs counted cash per tender).
- Staff PIN login with a `cashier` role. This is the start of staff RBAC.
- POS sale: an order with `source_channel = pos`, payment `paid`, and fulfillment `completed` (picked up) in one transaction.
- Receipt: HTML/print, plus SMS or email receipt. BIR OR/SI numbering only after compliance review.

**Ported from Veyron (logic, not code)**
- `tax.py`: VAT and senior/PWD VAT-exempt rules, together with their tests.
- Shift tender reconciliation.
- Idempotent sale finalize.
- Barcode and keyboard flow.
- Customer display.

**Veyron's future (decided):** it stays a separate product. It gets the security fixes, and no new features that overlap Guma Kart.

**V1 POS Lite scope**
- One register per location
- Cash, GCash/Maya (merchant-direct) and card terminal (recorded only)
- Senior/PWD discounts
- Receipt by print or SMS
- Close shift with variance

**Not in V1:** offline mode, BIR OR/SI numbering, split tender beyond two methods, multiple registers. These are V1.1.

---

## 13. Keep / port / retire

**Keep and wrap**
- `createOrderForTenant`
- The delivery orchestrator and Lalamove/Grab adapters
- Storefront, templates, Launch wizard and SEO
- The `change_requests` approval flow
- The checkout totals/config model
- PSGC address data
- Manual payment flow
- PayMongo webhook verification
- The AI layer
- The platform ops console
- The `/kart` UI components, which become the production checkout UI

**Port in**
- Veyron's VAT/PWD logic, shift reconciliation, finalize and receipts (V1.1)
- BayanGo's dispatch engine, behind its new partner API

**Retire or remove**
- The 9 placeholder dashboard pages
- `shop-builder.tsx`
- `v0-store/checkout-drawer.tsx`
- `/onboarding` redirect page
- `@gumakart/media`
- Demo tenants on the live lookup path (move them to `/preview`)
- Unused columns (after migration)
- Veyron's PayPal stub
- Duplicate shipping config (`settings.delivery` merged into the shipping profiles)

---

## 14. Metrics: instrumentation is part of the work

To measure these, Phase 2 must add `source_channel`, UTM capture, checkout-link counters and `message_log`. Most of these figures can't be computed today.

- **Activation:** % adding a first product · % creating a first link · % sharing a link (copy/share click) · % receiving a first order · median time to first order.
- **Conversion:** link views → checkout starts → orders · manual-payment confirmation time · recovery rate.
- **Fulfillment:** % of orders booked in-app · booking success rate by provider · delivery success rate · time from paid to delivered.
- **Messaging:** sends, delivery rate, failures, opt-outs, recovered orders.
- **Retention:** merchants active at 7 and 30 days · repeat buyers.

---

## 15. Revised V1 definition of done

1. A merchant signs up and reaches a shareable checkout link in about 5 minutes or less.
2. A buyer opens the link on mobile, enters a PSGC address, sees the delivery fee, and orders with GCash/Maya proof or COD.
3. The order appears in Guma with the correct source; stock is reserved, and is restored if the order is cancelled or expires.
4. The merchant confirms payment in one tap, or COD is marked due.
5. The merchant books delivery in one tap (Lalamove, Grab, manual, or BayanGo once it's gated in), and courier status flows back automatically.
6. The buyer gets SMS updates at each step, with no duplicates. Abandoned checkouts with consent get at most two recovery messages.
7. The order completes and the customer's history updates.
8. None of the stabilization issues from §3 can be reproduced.

---

## 16. Decisions

Decided on 2026-10-02 (see §0.1):
- Payments
- BayanGo
- Veyron and POS
- Pricing approach
- Hosting

Still open:
1. **"MINE" social automation:** confirm it as V1.2. It depends on Meta App Review (Business Verification) and TikTok API access.
2. **Final prices** in §18. Validate them in beta, and check the per-SMS cost with Semaphore before publishing.

---

## 17. Immediate next actions

1. ✅ BayanGo hook on the Guma side, plus the partner contract handed to Cursor.
2. Ship the Veyron and BayanGo security hotfixes (§3.3). Cursor can include the BayanGo ones in the partner-API work.
3. ✅ Phase 1 in Guma Kart: KYC lock, order tokens, the order service, stock restore — see `docs/PHASE-1-NOTES-2026-10-02.md` (needs migrations 0018 + 0019 applied).
4. Start the PayMongo track: fix attach, add the return page, run a live ₱1 test.
5. Write the Phase 2 migration spec (three statuses, locations, stock ledger, payment rows, outbox, message_log) and review it before coding.
6. Start the Cloudflare move for `platform`, which is the easiest. Then do `admin` after the upload and image changes (§19).

---

## 18. Pricing and packaging (recommendation)

**Principles**
- Selling is free, so sign-ups aren't blocked.
- Plans charge for **scale and automation**.
- POS is the headline upgrade and is also sold as an **add-on**.

Prices are proposals to validate in beta. The current plan catalog (`packages/plans/src/catalog.ts`) is free ₱0, growth ₱499 and pro ₱999.

| | **Free** ₱0 | **Growth** ₱499/mo | **Pro** ₱999/mo |
|---|---|---|---|
| Checkout links | Unlimited | Unlimited | Unlimited |
| Orders | Unlimited | Unlimited | Unlimited |
| Products | 25 | Unlimited | Unlimited |
| Manual GCash/Maya + COD | ✓ | ✓ | ✓ |
| Delivery booking (Lalamove/Grab/manual, BayanGo when live) | ✓ | ✓ | ✓ |
| Buyer SMS updates included per month | 50 | 500 | 1,500 |
| Abandoned-checkout recovery | — | ✓ | ✓ |
| Online store templates | 1 basic | All | All + premium |
| AI tools (descriptions, campaigns) | Trial quota | ✓ | Higher quota |
| "Powered by Guma Kart" badge | Shown | Removable | Removable |
| **POS Lite** | Add-on | Add-on | **1 register included** |
| PayMongo online payments (when live) | Transaction fee only | Transaction fee only | Lower fee |

**Add-ons (any plan)**
- **POS Lite:** ₱299/mo per register. On Pro, the first register is included and each extra one is ₱199/mo.
- **SMS packs:** for example 500 SMS. Price it at roughly 2× the Semaphore cost.
- **BayanGo:** no subscription; the merchant pays per delivery at the quoted fee.

**Why this shape**
- Free sellers can get their first order without paying, which is the activation metric.
- SMS is a real per-message cost, so it scales with the plan.
- POS has a clear willingness to pay for physical shops. Giving one register to Pro pulls shop owners up to Pro, and offering it as an add-on keeps it reachable for Free and Growth users.

---

## 19. Hosting: Cloudflare Workers now, Proxmox possible later

**Today:**
- `web` already runs on Cloudflare Workers via OpenNext (`kart.guma.one`).
- `admin` deploys to pm2 on Proxmox, but its crons are written for Vercel, so they likely never fire.
- `platform` has no deployment config.

**Moving to Workers (about 1–1.5 weeks)**

| App | Work needed |
|---|---|
| `platform` | Has no Node-only dependencies. Add a `wrangler.jsonc` and the OpenNext config, as `web` has. |
| `admin` | Three files need changes: `lib/product-uploads.ts` (local disk → R2), `lib/product-enhance.ts` (`sharp` → Cloudflare Images or skip), `lib/remove-background.server.ts` (local ONNX → the existing remove.bg API only). `@vercel/blob` gets replaced by R2. |
| Crons | Workers Cron Triggers call the existing `/api/cron/*` routes with `CRON_SECRET`, plus the currently unscheduled wallet-settlement job. |
| Inngest | Serve endpoint on the admin Worker. Inngest Cloud handles delays (`step.sleep`) for the SMS recipes. |
| Database | Stays on Neon. Add Cloudflare Hyperdrive later if latency matters. |
| Plan | The admin bundle will likely exceed the free Workers size limit, so budget for the **Workers Paid** plan (about $5/month). |

**Keeping a return to Proxmox possible.** These rules keep the code portable:
1. **No Workers-only APIs in business logic.** KV, Durable Objects and `env` bindings stay behind small adapters: a storage adapter (R2 today, MinIO or S3 on Proxmox later), and a cron adapter where crons are plain HTTP routes any scheduler can call.
2. **Storage uses the S3 API.** R2 and MinIO both speak it, so moving is a config change plus a bucket copy (`rclone`).
3. **Next.js stays standard.** The same apps build with `next build` / `next start` on Node, which is what pm2 runs today. OpenNext is only the Cloudflare packaging step.
4. **Database stays plain Postgres.** Neon to self-hosted Postgres is a `pg_dump`/`pg_restore` plus a `DATABASE_URL` change.
5. **Background jobs:** Inngest Cloud works from anywhere, and Inngest can also be self-hosted on Proxmox later.

Moving back later means: deploy the Node build to pm2 or Docker, point storage at MinIO, schedule the cron URLs with system cron, and switch DNS. No code rewrite.
