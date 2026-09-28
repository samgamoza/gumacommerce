# Guma Kart revamp — social automated checkout (UI-first)

**Where:** `apps/web/app/kart/**`, `apps/web/components/kart/**`, `apps/web/lib/kart/**`, `apps/web/app/kart/kart.css`, `apps/web/public/ph-address/**`.
**What it does NOT touch:** the tenant storefront (`app/[tenantSlug]`), the existing checkout form, admin, platform, DB, APIs. The old design stays as is.

Spec source: `guma-kart-redesign-plan.md` (Sam, 2026-09-28).

| Route | Spec section | Notes |
|---|---|---|
| `/kart` | §1 flow | Hub with the five-step flow and links to each screen |
| `/kart/setup` | §A | Keyword Trigger Setup card + sticky "Activate Auto-DM Listener" switch, live DM preview |
| `/kart/dm` | §B | Messenger-style thread with the slate chat card and the single orange CTA |
| `/kart/checkout` | §C | One page: order banner + 30-min hold timer, name + mobile (mobile is the key), **Region → Province → City → Barangay** strict selects (PSGC JSON, lazy per province), GCash / Maya / COD radio cards with COD fee warning, itemised fees above a sticky "Confirm Payment & Delivery via BayanGo" bar |
| `/kart/track` | §D | BayanGo timeline (Order locked → Packing → Handed to rider → Out for delivery → Arrived) + sticky "Chat with Seller on Messenger"; demo buttons simulate webhook stages |

Design tokens live in `kart.css` under `.kart` (BayanGo Orange `#FF6B00` for execution, slate DM card, GCash blue, Maya green). No images are fetched anywhere in the flow (spec §3.1); the product thumbnail is an inline SVG.

## Wiring it for real (next pass)
- `lib/kart/demo.ts` holds the demo seller/product, `quoteShipping()` (by PSGC region) and `computeTotals()`. Replace the first two with tenant product + the live delivery quote (`/api/delivery/quote`).
- `components/kart/checkout.tsx` `submit()` writes the order to `sessionStorage` and routes to `/kart/track`. Replace with a `POST` that creates the order (`createOrderForTenant`), a PayMongo intent for GCash/Maya, and returns the order number.
- `components/kart/track-view.tsx` reads that session order; replace with a fetch by order number and drive `stage` from BayanGo webhooks.
- Address dataset: `public/ph-address/index.json` (+ `barangays/<province>.json`). Same PSGC build as Kuya Eddie. The existing DB-backed `/api/locations` can be swapped in later without changing `AddressSelect`'s props.
