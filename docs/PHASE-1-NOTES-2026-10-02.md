# Phase 1 — Trust & correctness (2026-10-02)

Scope: KYC lock-down, order access links, a single order-status service, stock restore.
Builds on the BayanGo hook change set (migration 0018).

## Deploy checklist

1. Apply migrations **0018** (BayanGo provider enum) and **0019** (order access token + `stock_restored_at`):
   `pnpm --filter @gumakart/db migrate` (against Neon, from your machine).
   0019 back-fills a token for every existing order — old SMS links without `?t=` stop working (by design).
2. Env (admin): `WALLET_PAYOUTS_ENABLED=false`, optional `ORDER_UNPAID_EXPIRY_HOURS=24`, `CRON_SECRET` set.
3. Cron: `apps/admin/vercel.json` runs `/api/cron/expire-orders` daily (03:20 UTC — Hobby-safe).
   Hourly is better; on Cloudflare add a Cron Trigger calling it with `Authorization: Bearer $CRON_SECRET`.
4. Shops that were auto-"verified" by the old flow keep `kycVerified: true` in settings JSON, but payouts now
   check the **latest KYC session row**. Old sessions were already stored as `approved`, so they stay approved.
   Review them in Platform → Tenants if you want to re-check.

## What changed

### KYC lock-down
- Submitting KYC now sets the session to **submitted** (was: instantly approved).
- Only **Platform → Tenant → KYC verification → Approve/Reject** (with reason) changes it. Audited
  (`tenant_kyc_approved` / `tenant_kyc_rejected`). Dashboard attention strip shows “KYC to review”.
- Seller settings can no longer write `kycVerified` / `kycStatus` / `kycVerifiedAt` (stripped in `mergeSettings`
  and removed from the settings API schema).
- Seller KYC page: Verified / Under review / Rejected (reason + “Submit again”) / Not verified.
- Payouts: off unless `WALLET_PAYOUTS_ENABLED=true` (request, auto-payout and the simulated processor);
  require the latest KYC session to be approved; wallet row locked `FOR UPDATE` against double-spend;
  payout destination comes only from saved settings (request body can't redirect it). UI shows “Payouts are coming soon”.

### Order access links
- Every order has a 64-hex `access_token`. Buyer links are `/{shop}/orders/{number}?t=…` (SMS, checkout
  redirect, PayMongo `return_url`).
- Order page, payment-reference and payment-proof APIs require the token (constant-time compare). Without it the
  buyer sees “Open your order from your SMS”.
- Payment proof URLs must be ones we stored for that same order.

### One order-status service — `packages/db/src/queries/order-lifecycle.ts`
- `transitionOrderStatus({ source: seller | courier | system })` locks the order row and enforces the matrix.
  - Seller: accepted → preparing → ready/out → delivered, or cancel while unpaid. Can't set `paid`/`refunded`.
    A **paid order can't be cancelled — use Refund**.
  - Courier webhooks (Lalamove, Grab, BayanGo): forward-only, replays are no-ops.
  - System: unpaid expiry only.
- COD delivered → payment marked paid + a `cod` payment row + wallet credit (once).
- `refundOrder`: row lock with `NOWAIT` (double click → “already in progress”), PayMongo refund called inside the
  lock exactly once; manual/COD refunds are marked and the seller returns the money. If PayMongo refunded but the
  DB write failed, the error carries the PayMongo refund id.
- Payment arriving after a cancel (PayMongo webhook or manual confirm) does **not** reopen the order; it's logged
  and noted in history so the seller refunds.

### Stock restore
- Cancel / refund / expiry put stock back **exactly once** (`stock_restored_at` claim), only while the goods are
  still with the seller (not after out-for-delivery).
- `expireUnpaidOrders` cancels unpaid orders older than the cutoff, skipping ones where the buyer already sent a
  reference.

## Bug found by the new tests
drizzle-orm 0.38 renders `.for("update", { noWait: true })` as `for update no wait` (invalid SQL). The refund lock
uses a raw `FOR UPDATE NOWAIT` instead.

## Tests
- `pnpm --filter @gumakart/db test:integration` (local Postgres only): 16/16 — includes `order-lifecycle.test.ts`
  (cancel race restocks once, paid can't cancel, tenant scoping, courier forward-only, COD delivered, expiry,
  paid-after-cancel, refund race calls the gateway once, manual refund, token required, KYC lock-down, payouts gate).
- db unit 26/26, services 40/40. Typecheck clean: db, services, admin, web, platform.

## Not in Phase 1 (next)
- PayMongo fix track (attach flow needs a real payment-method id; webhook signature check review).
- Per-event webhook dedupe table (inbox/outbox) — Phase 2.
- Real disbursement provider for payouts.

---

## Phase 1 close-out (2026-10-03)

Deploy: apply migration **0020** (`stock_movements`) after 0018/0019. Set `STOREFRONT_PREVIEW_SECRET`
(≥32 chars) on **both** admin and web — it falls back to `AUTH_SECRET`, and the web app may not have that.
Without it, seller "Preview" shows the live shop instead of the draft.

### Webhook hardening
- **Grab:** rejects every request (503) when `GRAB_WEBHOOK_SECRET` is unset; the signature is always required.
- **Lalamove:** the old check signed the whole raw body, which contains the signature itself, so no genuine
  Lalamove event could pass. Now follows Lalamove's guide: HMAC-SHA256 with the API secret over
  `timestamp\r\nPOST\r\n<your webhook path>\r\n\r\n<JSON data>`, and `apiKey` must match `LALAMOVE_API_KEY`.
  **Still needs one sandbox event to confirm** (the guide doesn't spell out the JSON serialization). If a
  proxy changes the path, set `LALAMOVE_WEBHOOK_PATH`.

### Reserved slugs and demo shops
- Reserved: every top-level storefront route (`about`, `kart`, `preview`, `uploads`, `frontend1`, `guma-one-ai`,
  `model`, …) and anything ending in `-demo`. Existing shops aren't renamed — check none already use these.
- Real shops are looked up **before** built-in demos (storefront, checkout, order page), so a demo can never
  shadow a merchant or swallow a real order.

### Tenant scoping
- Push unsubscribe only deletes the subscription if it belongs to the seller's shop.
- Draft storefront (`?preview=1`) needs a signed link (`/api/storefront-preview` in admin → 2-hour token for that
  shop). Every admin "Preview" link goes through it.

### Stock ledger (`stock_movements`, migration 0020)
- Append-only. Written in the same transaction as every stock change: `sale`, `restock_cancel`,
  `restock_refund`, `restock_expiry`, `adjustment` (seller edit, variant row locked), `initial` (new product,
  plus a back-filled opening balance per tracked variant).
- One row per order × variant × reason (unique index), so retries can't double-count.
- Seller API: `GET /api/products/{id}/stock-movements`.

### Sister products
- **Veyron** (`veyron-pos-saas`, commit `999833a`): super_admin can't be assigned or touched from
  `/admin/users`; `/debug/routes` only when `APP_ENV=development` (make sure production sets `APP_ENV=production`);
  API login rate limited; PayPal stub disabled. Also fixed a tenant-scoper bug that made every scoped
  `INSERT … VALUES` without `tenant_id` fail (adding a user was broken). 90/90 tests on SQLite.
- **BayanGo:** the three fixes are in Cursor's partner-API prompt (`docs/CURSOR-PROMPT-PARTNER-API.md`).

### Tests
db integration 17/17 (adds ledger reconciliation), db unit 26/26, services 42/42 incl. preview token and Lalamove
signature; typecheck clean for db, services, auth, admin, web, platform.

### Phase 1 exit status
Everything in plan §3 is done except: the Lalamove sandbox confirmation (needs your Lalamove sandbox keys) and the
BayanGo fixes (Cursor). Next per §11: Phase 2 (write the migration spec first), PayMongo track, Cloudflare move.
