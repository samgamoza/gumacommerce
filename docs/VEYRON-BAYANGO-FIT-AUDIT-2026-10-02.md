# Veyron POS and BayanGo: fit audit against the Guma Kart V1 plan

**Date:** 2026-10-02

**What was audited**

| Repo | Location | Branch | Commit |
|---|---|---|---|
| BayanGo | `D:\All Apps\BayanGo App` | `main` | `0386136` |
| Veyron POS | `D:\All Apps\veyron-pos-saas` | `feature/ci-locations-promotions` | `88e942a` |

**Method:** I read the code directly. Docs were used only as hints. The most serious findings were re-checked line by line and are marked **(verified)**.

**Related documents:** `CURRENT-STATE-AUDIT-2026-10-02.md` (Guma Kart) and the Guma Kart V1 Implementation Plan.

---

## Bottom line

| | BayanGo | Veyron POS |
|---|---|---|
| What it is | A pilot single-tenant delivery app: NestJS + Postgres backend, React PWA for buyer/merchant/rider, ops admin, Flutter scaffold | A broad but early POS SaaS: Python/Flask + Jinja, SQLite or Postgres, with its own storefront, QR ordering, marketplace, plans and billing |
| Can it be the plan's component today? | **No.** It has no partner API, no outbound webhooks, real quoting, live tracking or failed-delivery state, and its production migration path is broken. | **No, not as "the same Commerce Core".** The stack, IDs, money types and schema are all incompatible, and no integration code exists. |
| Biggest blocker | Security: any self-registered rider can take any job and read its proof-of-delivery PIN | Security: any tenant admin can make themselves platform **super_admin** (verified) |
| Recommended role in V1 | Become a Guma Kart `DeliveryProvider` after about 2–4 weeks of partner-API work plus a security pass. Until then, Guma Kart ships with Lalamove, Grab and manual riders. | Treat it as a **feature and logic reference**. Build the POS inside the Guma Kart monorepo on the shared core, porting VAT, senior/PWD, shift and finalize logic. Do not sync two databases. |

---

## 1. BayanGo

**Stack and components**
- NestJS 11, TypeORM, Postgres 16, Redis/BullMQ, MinIO, with the API at `/api/v1`.
- `preview/` is the real pilot client: a React PWA for buyer (`/`), merchant (`/merchant`) and rider (`/rider`).
- `admin-web/` is the ops console.
- The `mobile/` Flutter app does customer booking only. Its rider home is a stub.
- It runs on a laptop behind a Cloudflare tunnel (`preview.guma.one`). The k8s files are templates.

**Delivery workflow**

| Step | Status | Detail |
|---|---|---|
| Create | Implemented | `POST /deliveries`, **customer role only**. Merchants cannot create deliveries, only advance store orders. |
| Quote | Toy | ₱55 + ₱12 × `distanceKm`, where the client supplies the distance (default 3). No zones or rural pricing. Fee and COD amount are taken from the client. |
| Dispatch | Basic | Nearest online rider within 20 km via Redis GEO, 45-second offer, SMS. Manual ops assignment exists. There is no decline, no rider exclusion, and nothing retries once it reports "no riders". |
| Rider flow | Implemented | accept → pickup → en-route → complete with a 4-digit PIN. Photo proof is just a string, and there is no upload endpoint. |
| Statuses | — | `requested, order_placed, preparing, ready_for_pickup, finding_rider, rider_assigned, picked_up, en_route, delivered, cancelled`. No failed, returned, scheduled or out-for-delivery. |
| Tracking | Not found | Rider location is written only when going online. No tracking URL or page; clients poll. |
| Payments | Implemented | COD and manual GCash reference with admin review. No gateway, refunds or rider COD remittance. Settlements are bookkeeping rows only (8% fee). |
| Notifications | Partial | SMS via PhilSMS. Many messages go to a `null` recipient (only logged), and **the PIN is never sent to the recipient**. |
| Addresses | Partial | PSGC is used for onboarding only. Deliveries store free-text labels plus optional lat/lng, and there is no geocoding. |

**Partner surface:** **Not found.** There are no API keys or service accounts, no partner/tenant entity, and no outbound webhooks. The repo's own handoff lists "Guma Commerce webhook" as a planned high-priority item that hasn't been started. The closest existing pieces:
- `POST /deliveries`, which is idempotent through `clientMutationId`
- `POST /deliveries/:id/cancel` and `GET /deliveries/:id`
- `DeliveriesService.transition()`, which already writes an audit row on every status change and is the natural hook for an outbox

**Production readiness**
- The migrations have drifted far from the entities. Missing columns include payment method, PIN, proof fields and several payment-reference columns; `merchant_settlements` has no migration; and the GCash unique-index migration fails on a fresh database.
- Production configs set `TYPEORM_SYNC=false`, so a production deploy gets a schema the code can't use.
- CI runs `npm ci`, but no lockfile exists.
- Docker compose sets `DEV_OTP=123456` with `NODE_ENV=production`.

**Security, highest first**
1. **Proof-of-delivery bypass.**
   - `accept()` never checks that the rider is approved or that they are the rider the job was offered to (verified).
   - Rider self-registration is public.
   - `GET /platform/fulfillments` returns open jobs **with their PIN** to any rider (verified, `platform-store.service.ts:561`).
   - Together, any new account can accept a job, read the PIN and "complete" a delivery, which marks COD as paid and creates a settlement.
2. `GET /deliveries/:id` and `/deliveries/active` expose other customers' names, phones and addresses to any logged-in user.
3. Customers can force status changes through sync, and money fields are trusted from the client.
4. Admin can set `delivered` without PIN, COD or settlement checks.
5. Status changes have no locking, so two riders can both accept the same job.
6. OTP accepts the dev code when SMS isn't configured, and the PIN is stored in plaintext.

**Mapping to the Guma Kart `DeliveryProvider` interface**

| Guma Kart need | BayanGo today | Effort |
|---|---|---|
| `isServiceable` | No service-area model; could use online riders near the pickup point, or a municipality allow-list | S–M |
| `quote` | Toy pricing; needs server-side distance, a zone/rural fee table, and a persisted quote id with expiry | M |
| `book` | Needs partner auth, server-priced fee, prepaid/external payment type (today a prepaid order would wrongly create a pending GCash payment), external order reference, recipient PIN SMS | M |
| `cancel` | Endpoint exists; needs ownership checks, reason and cancel window | S |
| Webhooks back to Guma | Not found; needs subscription table, outbox in `transition()`, BullMQ sender with retries, HMAC signing (mirror Guma's `webhook-signature.ts`) | M |
| Scheduling / live tracking / failed / returned | Not found | M each |
| Multi-merchant partner | Not found | M |

**Status mapping to Guma Kart**

| Guma Kart | BayanGo |
|---|---|
| accepted | `rider_assigned` (`finding_rider` while unassigned) |
| picked up | `picked_up` |
| in transit / out for delivery | `en_route` (one state covers both) |
| delivered | `delivered` |
| pickup scheduled, failed, returned | none |

**Effort:** a minimum viable partner integration is about **2–4 developer-weeks**, plus 1–2 weeks for tracking and scheduling. On the Guma Kart side, add `bayango` to the `delivery_provider` enum and implement the adapter.

---

## 2. Veyron POS

**Stack**
- Python 3.12, Flask, gunicorn, Jinja, raw SQL.
- SQLite by default, or Postgres via a SQL translation shim.
- No migration tool: about 100 `ALTER`s run on every boot.
- Integer IDs, money stored as floats, timestamps stored as text.
- The Prisma/Node pieces are **dead** (a partial, drifted mirror; there is no `neon.ts`).
- Production is Docker + Postgres 16 on Proxmox CT 102 (`veyronpos.guma.one`), not Neon.
- CI: pytest on SQLite plus a Postgres RLS job, 89 tests.

**POS transaction trace**

| Step | Status | Detail |
|---|---|---|
| Cashier login | Implemented | Username + PIN |
| Shift open/close | Partial | Server side works. **The shift forms are nested inside the checkout form in `pos.html`**, so the buttons likely submit checkout. A shift isn't required to sell. |
| Product selection and cart | Implemented | Client-side, with barcode input and a customer display |
| Discounts | Partial | Senior/PWD 20% (VAT-exempt) and custom % in the web POS. Promo codes work in the JSON API only. Loyalty redemption is never called. |
| Payment | Partial | Web POS records a single method with no tendered amount or change. Split tender and PayMongo exist only via the API. The cashier UI never calls PayMongo. |
| Sale record | Implemented | `finalize_pos_sale` with an idempotency key, but the web form never fills that key in |
| Inventory | Implemented | Conditional decrement plus a `stock_movements` ledger. Stock is tenant-wide, not per location, and is also deducted for pending PayMongo sales. |
| Customer | **Not found** | Sales have no `customer_id` |
| Receipt | Partial | HTML receipt plus a JSON payload. The print bridge is a stub. No BIR OR/SI numbering, no email or SMS. |
| Z-report | Partial | A dashboard aggregate in server UTC. Split-tender sales drop out of the tender buckets. |
| Void / refund | Partial | Whole sale only, with stock returned. PayMongo, promo and loyalty are not reversed. |
| Offline | Not found | — |

**Other features:**
- QR table ordering and the eTown marketplace both create `orders` rows. These **never deduct stock and have no status workflow**; the merchant view is read-only.
- Subdomain storefront.
- Locations CRUD, but there is no branch selector and every sale goes to the default branch.
- Plans and billing, super-admin console, SMTP alerts.
- Internal riders with flat fees.
- A PayPal "gateway" that is a **fake stub returning success** and is enabled by default.

**API:** session-cookie JSON API, CSRF-exempt. No API keys, no outbound webhooks or events, no Guma/BayanGo integration code. `products/sync_service.py` is a dead 12-line stub.

**Security, highest first**
1. **Privilege escalation (verified):**
   - `/admin/users/add` and `/admin/users/edit` require `manage_users`, which is granted to `tenant_admin`.
   - Both accept any role in `ALLOWED_USER_ROLES`, and that set includes `super_admin` (`flask_config.py:75`).
   - A super_admin session bypasses tenant scoping and RLS, so any shop owner can take over every tenant's data.
2. In SQLite mode, any owner can back up, download and **restore the whole multi-tenant database**.
3. `/debug/routes` is public.
4. `POST /api/auth/login` has no rate limit, and 4-digit PINs are allowed.
5. Login looks usernames up globally, but uniqueness is only enforced per tenant, so one tenant can shadow another's user.
6. Order confirmation pages use sequential IDs and expose other customers' addresses.
7. RLS caveats: the app role can turn on its own bypass flag, `cash_register_shifts` has no RLS, and the regex tenant scoper skips any query that mentions `tenant_id`.

**Entity mapping to the Guma Kart core**
- **Products:** product-level `stock`, `price`, `cost` and `sku`, versus Guma's variant-level `stock_qty`, with no cost or sku.
- **IDs:** integer versus uuid.
- **Money:** float versus `decimal(12,2)`.
- **Sales:** map to `orders` (with `source_channel='pos'`), but Guma would need new location, cashier, shift, discount-type and senior/PWD fields.
- **No Guma equivalent:** locations, register shifts, stock-movement ledger, promotions table, loyalty, staff PIN auth.
- **Veyron's online `orders`** duplicate Guma orders.

**Options for "a POS sale becomes a Guma order"**

| Option | Verdict | Why |
|---|---|---|
| Shared database | Not viable | Incompatible schemas, and Veyron runs DDL on boot |
| API sync, Veyron → Guma | Possible but heavy | Needs machine auth on Guma, ID-mapping tables, a Veyron outbox, and two inventories kept in sync, which risks double-selling |
| Rebuild the POS inside the Guma Kart monorepo | **Recommended** | Port VAT and senior/PWD (`app/core/tax.py`, tested), shift tender reconciliation, idempotent finalize, promo/loyalty rules and the receipt payload |

---

## 3. What this means for the V1 plan

1. **The plan's "do not rebuild existing Veyron and BayanGo functionality that already works" doesn't match reality.**
   - Neither system can plug into a shared core as-is.
   - BayanGo's delivery engine is worth keeping, behind a new partner API.
   - Veyron is valuable mainly as PH-specific POS logic and UX to port.
2. **Move Veyron POS out of P0.** Making the POS share the core means building it inside Guma Kart. Schedule it as V1.1, after core alignment adds locations, shifts, a stock ledger, `source_channel='pos'`, and staff/PIN roles.
3. **Make BayanGo's partner API its own track, outside Guma Kart, and gate "BayanGo as default" on it.**
   - Required before default: partner auth, server-side quote, book/cancel, signed webhooks, failed/returned states, the security fixes, and a migration repair.
   - Until then, Guma Kart's "Fulfill" uses Lalamove, Grab and manual riders through the existing orchestrator, and BayanGo plugs in as the preferred provider when ready.
4. **Fix the three critical security issues now.** The Veyron super_admin escalation and the BayanGo PIN/accept bypass are live-exploitable in their current deployments, independent of Guma Kart.
5. **Stop the duplication from growing.** Veyron has its own storefront, online ordering, customers, PayMongo integration, riders and plans. Pause new work there that overlaps Guma Kart (storefront, QR/online orders, delivery).
