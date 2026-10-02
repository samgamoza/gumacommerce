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
