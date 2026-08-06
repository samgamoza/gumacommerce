# MVP / Beta — Manual e-wallet checkout + in-store buyer↔seller chat

**Status:** Implemented (2026-08-05) · **Chat MVP Beta plan executed (2026-08-05)**  
**Mode default:** `PAYMENTS_MODE=manual_ewallet` (bypasses PayMongo until API is secured)

---

## Chat MVP Beta (owner-led, free)

Simplest realistic plan for beta:

1. **`/messages` is the sales hub** — seller replies for products, GCash/Maya proof, revisions.
2. **Buyer entry points** — storefront chat bubble (Message seller), order page CTA, payment panel link.
3. **AI = FAQ only** (“Quick answers”) — never confirms payment; hand off to Message seller.
4. **WhatsApp overflow** — optional FAB / in-chat link when phone is configured (Settings → WhatsApp).
5. **Not in beta** — Messenger API, WebSockets, ChatSgg import.

Polling: ~4s while a thread is open (buyer + seller). Good enough for shop ops; not Messenger-instant.

---

## Buyer flow

Also supports screenshot upload: `POST /api/orders/payment-proof` → `proofUrl` on payment reference.

1. Checkout chooses **GCash / Maya / Bank** (or COD).
2. Order created as `pending_payment` (no PayMongo call).
3. Order page shows **receiving account** + exact amount + order number.
4. Buyer sends money outside Guma, uploads screenshot and/or reference, and/or uses **Message seller**.
5. Seller taps **Confirm payment** on Orders → `paid` → normal fulfill path.

## Seller setup

- **Settings → Payments:** GCash / Maya / bank receiving details + mode.
- **Messages:** reply to storefront chat threads (empty state explains how to test).
- **Orders:** Confirm payment for pending e-wallet orders.
- **Settings → WhatsApp (optional):** overflow link for buyers.

## Chat

- Storefront widget: **Message seller** (default for orders) + optional **Quick answers** AI.
- Messages persist in `shop_chat_messages` (`buyer` / `seller` / `assistant`).
- Admin `/messages` inbox for human replies.
- Order page: **Need help with this order?** → Message seller (tags `[Order …]`).

## Flip to PayMongo later

Set `PAYMENTS_MODE=paymongo` or `both`, and configure PayMongo keys (P1 fail-closed still applies). Manual path can remain as fallback under `both`.

## Key files

- `packages/services/src/payments/adapter.ts` — mode + manual instructions
- `packages/db/src/queries/manual-payments.ts` — confirm / reference
- `apps/web/app/api/checkout/route.ts` — manual branch
- `apps/web/app/api/chat/route.ts` — buyer↔seller + AI FAQ
- `apps/web/components/storefront/shop-assistant.tsx` — buyer widget
- `apps/web/components/storefront/message-seller-button.tsx` — order CTA
- `apps/admin/app/messages/*` — seller inbox
- `apps/admin/app/settings/payments/*` — receiving accounts
