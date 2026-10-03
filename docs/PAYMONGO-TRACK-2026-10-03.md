# PayMongo track — hosted checkout (2026-10-03)

## What changed
- Online payments now use **PayMongo hosted checkout** (`POST /v1/checkout_sessions`). One integration for GCash,
  Maya, QR Ph and card. The buyer pays on PayMongo's page, so card numbers never touch Guma Kart.
- The old flow could not work: it "attached" a payment method by type with no payment-method id, and cards
  can't be collected server-side at all.
- **Return page:** PayMongo sends the buyer back to their tokenized order page (`?t=…&paid=1`), which shows
  "We're confirming your payment" and refreshes itself. Cancelling returns to the same page with a
  **Continue to payment** button (only a `paymongo.com` URL is ever shown).
- The PayMongo order page no longer shows the shop's manual GCash/bank instructions.
- **Webhook:** handles `checkout_session.payment.paid` and `payment.paid`. Both resolve to the stored payment-intent id,
  so the second event is a no-op, and the PayMongo payment id needed for refunds is stored.
- **Plan upgrades** (Settings → Subscription) use the same hosted checkout.
- Tests: services 45/45 (request shape, return URLs, webhook parsing).

## To go live (needs you)
1. PayMongo dashboard → Developers → Webhooks: add `https://<web host>/api/webhooks/paymongo` with events
   `checkout_session.payment.paid`, `payment.paid`, `payment.failed`. Put the secret in `PAYMONGO_WEBHOOK_SECRET`.
2. Set `PAYMONGO_SECRET_KEY` (test key first). Turn on PayMongo for one shop: Platform → Tenant → payments mode.
3. Test mode: one order each for GCash, Maya, QR Ph and card → each order turns paid, refund works from Orders.
4. Live ₱1 (or minimum amount) test per method, then refund it. Reconcile against the PayMongo dashboard.
5. Before real merchants: legal/BSP review of collecting on merchants' behalf (plan §11), then real payouts.
