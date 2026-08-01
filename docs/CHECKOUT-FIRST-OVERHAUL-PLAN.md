# Checkout-First Overhaul Plan

**Status:** Proposed · **Date:** 2026-07-21 · **Scope:** `apps/web`, `apps/admin`, `packages/storefront-themes`, `packages/db`

---

## 1. Product thesis (the correction)

**Gumacommerce _is_ Guma One.** It is a **unified smart checkout-automation system** for
sellers who already have an audience on Facebook / TikTok / Instagram and today sell through
manual **"PM me / DM me"** chat threads.

Guma One's job is to **automate that order-to-pay flow** and **layer onto the seller's existing
social presence** — _not_ to give them a new website and _not_ to pull their buyers away from the
channel where they built their following.

> It is **not** Shopify. It is **not** a website builder. (Site-building is a different product,
> "Guma AI", which is not guma.one.)

---

## 2. Current architecture (as audited)

### 2.1 Onboarding = a website-theme builder

The "GUMA Launch" wizard ([`apps/admin/components/launch-wizard.tsx`](../apps/admin/components/launch-wizard.tsx),
API [`apps/admin/app/api/launch/route.ts`](../apps/admin/app/api/launch/route.ts)) walks the seller
through:

```
dna → templates → personalize → preview → done
```

- **dna** — collect business name, category, vibe, audience, product-count, goals → `buildStoreDNA`
- **templates** — `recommendTemplates(dna)` scores ~27 vertical themes and the seller **picks one**
- **personalize** — tagline, promo title/subtitle, primary/accent colors, palette
- **publish** — `publishStorefrontWithApproval` emits `Theme.Published` / `Store.Published`

The seller's entire "launch" is **choosing and styling a website theme.**

### 2.2 The storefront = ~20 themed micro-sites

[`apps/web/app/[tenantSlug]/page.tsx`](../apps/web/app/[tenantSlug]/page.tsx) →
[`tenant-storefront-home.tsx`](../apps/web/components/storefront/tenant-storefront-home.tsx) dispatches
by `pattern.storefrontRenderer` into one of ~20 vertical renderers under
`apps/web/components/storefront/*` — each a full marketing site with **hero + about + portfolio**
(e.g. `studio`, `bloom`, `sarab`, `aircon`…), plus a neutral fallback `ThemedStorefrontHome`.

### 2.3 The "intelligence" = template matching

[`packages/storefront-themes`](../packages/storefront-themes) (`recommend-templates.ts`, `patterns.ts`,
`template-packages.ts`, `templates.ts`, `template-registry.ts`, `template-previews.ts`) is a large
deterministic scoring engine whose entire output is **which visual theme to apply.**

### 2.4 The checkout backend (the part that's actually right)

This is real and solid:

- [`apps/web/app/[tenantSlug]/checkout/page.tsx`](../apps/web/app/[tenantSlug]/checkout/page.tsx) +
  [`checkout-form.tsx`](../apps/web/components/checkout-form.tsx): **GCash, Card, COD**, Lalamove
  live delivery quotes, pickup, coupons.
- Orders, PayMongo webhook, Lalamove webhook, wallet, KYC, shipping settings — all present.
- The **"Order Now" link** concept already exists (`/{slug}?utm_source=instagram`, `/{slug}/checkout`).

---

## 3. The architectural flaw

The pipeline is shaped as **"generate a storefront website,"** when the mission is **"automate
checkout on top of the seller's existing socials."** Four specific faults:

| # | Fault | Symptom observed |
|---|-------|------------------|
| 1 | **Wrong output** — the artifact is a themed *website*, not a checkout | PrintAir got a photography micro-site with hero/about it never needed |
| 2 | **Intelligence mis-allocated** — smarts spent picking a *visual theme* | Printing & Signage force-mapped to the photography `studio` theme; dead fallback image; "portrait sessions / wedding coverage" copy on a print shop |
| 3 | **Wrong traffic direction** — a standalone site asks buyers to *leave* FB/IG/TikTok for guma.one | Directly contradicts "don't veer them away from their audience" |
| 4 | **Wrong abstraction → brittle** — 27 templates + scoring engine + 20 renderers maintaining the wrong idea | A single missing "print" theme cascades into a fully broken tenant |

**Root cause:** onboarding and the storefront treat _theme selection_ as the core loop. It should
be _connect socials → list products → take payment → hand back a shareable checkout link._

---

## 4. Target architecture

### 4.1 New onboarding loop (replaces dna→templates→personalize)

```
Identify shop  →  Import / add products  →  Set payment + fulfillment  →  Get "Order Now" link
   (name, logo,      (paste catalog / add       (GCash/COD/Card,             (drop in bio, post,
    1 accent color)   manually / import)         pickup/Lalamove)             DM auto-reply)
```

- **No template step. No theme personalization step.** Branding is reduced to _logo + one accent
  color unique to each tenant + a banner image_, applied to a single neutral checkout surface.
  (Banner image is the highest-value branding lever — it's what makes the checkout look like
  *their* shop without any site-building.)
- The wizard's job becomes **"can this seller take an automated order today?"** — the completion
  criteria are _≥1 product + ≥1 payment method + fulfillment configured_, not "theme published."

### 4.2 One neutral checkout surface (replaces ~20 renderers)

`/{slug}` renders a single, brand-neutral, phone-width **checkout surface**: shop logo + name,
product list, cart, and the existing checkout. No hero, no about, no portfolio. It exists only to
be the destination of a link the seller shares _inside_ their own channel.

`ThemedStorefrontHome` is already ~90% this; the target is a trimmed descendant of it (drop
`PromoBanner`/`PremiumStorefrontSections`/hero header, keep product grid + Order/checkout + share
link).

### 4.3 Keep the buyer in-context

The center of gravity moves to the **shareable checkout link + DM automation**, not a site visit:

- Per-product and per-shop "Order Now" links (already partially present).
- Optional DM/comment auto-reply that returns a checkout link (the "PM me" automation) — leverages
  the existing agents/whatsapp-agent surfaces.

---

## 4A. The core: unified smart checkout + auto-delivery (the intelligence layer)

**This is the primary build focus.** The "intelligence" that used to pick a website theme is
redirected to where it creates value: **getting an order paid and delivered automatically.**

### 4A.1 Where delivery is today

- Single-provider, **manually chosen** in `settings/delivery-shipping`
  (`provider: "lalamove" | "grab" | "manual"`).
- Only **Lalamove** is truly wired end-to-end: `quote → book → track` via
  [`packages/services/src/delivery/lalamove.ts`](../packages/services/src/delivery/lalamove.ts)
  (`QuotationInput→QuotationResult`, `BookDeliveryInput→BookDeliveryResult`), persisted to the
  generic `deliveries` table (`delivery_provider` enum + `recordDeliveryQuote` /
  `createDeliveryBooking` / `updateDeliveryByProviderOrderId`).
- `grab` exists in the enum but has no adapter. There is **no aggregation, no auto-select, no
  failover, and no BayanGo.**

The lifecycle abstraction is already the right shape — it's just hardcoded to one provider.

### 4A.2 Target: a delivery orchestration layer

Introduce a provider-adapter abstraction and an orchestrator that **auto-quotes, auto-selects, and
auto-dispatches** across all serviceable providers:

```
DeliveryProvider (adapter interface)
  id
  isServiceable(pickup, dropoff) -> boolean
  quote(input)   -> { provider, fee, etaMinutes, quoteRef, expiresAt }
  book(quoteRef) -> { providerOrderId, status, trackingUrl }
  cancel(id)     -> void
  parseWebhook(payload) -> { providerOrderId, status }

Adapters:
  - LalamoveAdapter   (wrap existing lalamove.ts — already built)
  - GrabAdapter       (GrabExpress — BUILD NOW, real adapter)
  - ManualAdapter     (seller self-delivers / meetup)
  - BayanGoAdapter    (in-house — OPEN HOOK ONLY; not yet deployed, wire the
                       slot + feature flag now, real integration later)
```

```
DeliveryOrchestrator (the intelligence)
  quoteAll(order)  -> quotes every enabled+serviceable provider in parallel
  autoSelect(quotes, policy) -> best quote
       policy: serviceable first, then NEAREST & FASTEST first (ETA/distance),
       cost as tiebreaker; when BayanGo is live, prefer it where it services
  dispatch(order)  -> books the selected provider on paid/confirmed;
                      on reject/timeout, auto-failover to next-best quote
```

### 4A.3 In-context cart + checkout

- The cart/checkout is a **link surface** the buyer opens from the seller's bio/post/DM and returns
  from — no site detour. Reuse [`checkout-form.tsx`](../apps/web/components/checkout-form.tsx)
  (GCash / Card / COD, coupons) and surface the **auto-selected delivery option inline** (with an
  optional "change" affordance), instead of asking the seller to pre-pick a courier.
- On payment confirmation the orchestrator dispatches delivery automatically and returns tracking to
  both buyer and seller.

### 4A.4 BayanGo (in-house) — open hook only

BayanGo is in **final development, not yet deployed.** So we build only the **slot**: register it in
the provider enum + orchestrator behind a feature flag, with a stub adapter that reports
`isServiceable → false` (never selected) until the real integration lands. When it deploys, we drop
in the real `BayanGoAdapter` and flip the flag — no orchestrator changes. Policy will prefer BayanGo
where it services, once live.

---

## 5. Keep / Change / Deprecate inventory

| Area | Verdict |
|------|---------|
| Checkout form, orders, PayMongo, Lalamove, wallet, KYC, shipping | **Keep** — this is the product |
| `/{slug}/checkout`, order links | **Keep**, promote to the primary flow |
| `ThemedStorefrontHome` | **Keep & trim** into the single checkout surface |
| LaunchWizard `dna`/`templates`/`personalize`/`preview` steps | **Replace** with products → payment → link steps |
| `packages/storefront-themes` scoring engine + `recommend-templates`/`patterns` | **Deprecate** (retire behind a flag; stop selecting vertical themes) |
| ~20 vertical renderers (`studio`, `bloom`, …) | **Keep as an optional paid upsell** ("fancy storefront"). Freeze as the *default* (route new/unmatched tenants to the neutral surface), but leave available opt-in. _(Decision #1 — resolved.)_ |
| Store DNA (`buildStoreDNA`, `store_dna_json`) | **Downscope** to brand basics (logo/color) + selling context; stop driving template choice |

---

## 6. Phased implementation (incremental, non-breaking)

**Phase 0 — Stop the bleeding (small, safe)**
- Remove the `print/signage → studio` force-mappings in `recommend-templates.ts` (lines ~147, ~156)
  and `resolveInstallId` (~249); drop `print|signage` from the `studio` pattern
  ([`patterns.ts:263`](../packages/storefront-themes/src/patterns.ts)).
- Any unmatched category resolves to the neutral `clean-guma` surface, never a vertical theme.
- _Outcome:_ no seller is ever handed a mismatched vertical website. PrintAir renders neutral.

**Phase 1 — Neutral checkout surface**
- Fork `ThemedStorefrontHome` into `CheckoutStorefront` (product grid + cart + Order/checkout +
  share link only). Route `/{slug}` to it by default; gate legacy vertical renderers behind an
  explicit opt-in flag on the tenant.

**Phase 2 — Delivery orchestration (PRIMARY FOCUS, per §4A)**
- Extract a `DeliveryProvider` adapter interface; wrap the existing Lalamove code as the first
  adapter (behavior-preserving).
- Add `bayango` to the `delivery_provider` enum + shipping/settings types; build the **BayanGo**
  adapter (in-house) and a `GrabAdapter` stub.
- Build the `DeliveryOrchestrator` (`quoteAll` / `autoSelect` / `dispatch` + failover).
- Flip checkout + settings from "seller picks one courier" to "orchestrator auto-selects" (seller
  enables an allow-set / "auto"); show the chosen option inline in checkout with optional change.

**Phase 3 — Re-scope onboarding**
- Rebuild `LaunchWizard` steps to `identify → products → payment+fulfillment(auto-delivery) → share link`.
- Replace `select_template`/`personalize` with `set_branding` (logo + accent) — **but keep the
  template + personalize path available as an opt-in upsell**, not the default.
- Make "done" require an orderable shop (≥1 product, ≥1 payment method, delivery configured), not a
  published theme. Update `needsGumaLaunch` / launch-state completion.

**Phase 4 — Product import + in-context ordering**
- Product import (paste list / CSV / image-first quick add; later: connected FB/IG catalog).
- First-class per-product order links; DM/comment auto-reply → checkout link, on top of the
  existing agents/whatsapp surfaces.

**Phase 5 — Cleanup (non-destructive)**
- Legacy vertical renderers + theme scoring engine remain, but only reachable via the upsell opt-in.
  Downscope `store_dna_json` to the branding + selling-context shape for default (non-upsell) tenants.

---

## 7. Data / event changes

- `tenants.theme_*` columns: retain `logo_url`, `primary/accent`; stop writing `templateId`/patterns
  as the driver of rendering (kept only for legacy opt-in tenants).
- `store_dna_json`: shrink to `{ brand: {logo, accent}, sellingContext }`; drop
  `selectedTemplateId`, template scoring inputs.
- Events: `Store.Published` → reframe as `Store.Ready` (orderable), decoupled from
  `Theme.Published`.

## 8. Migration for existing tenants (incl. PrintAir)

- Backfill: any tenant whose `templateId` is a vertical theme they didn't deliberately choose →
  switch to the neutral checkout surface. (Per user's directive we **do not** hand-patch PrintAir;
  it is fixed by Phase 0 + Phase 1 like everyone else.)

## 9. Open decisions

- ✅ **Legacy vertical templates** — **kept as an optional paid upsell** (resolved 2026-07-21).
- ✅ **Primary focus** — unified smart checkout + in-context cart + **auto-delivery** orchestration
  (existing apps + in-house BayanGo) (resolved 2026-07-21).

All resolved 2026-07-21:

1. ✅ **BayanGo** — still in final development, **not yet deployed**. Build an **open hook** only
   (enum slot + flagged stub adapter that never gets selected); drop in the real integration later.
2. ✅ **Auto-select policy** — **nearest and fastest first** (ETA/distance), cost as tiebreaker.
3. ✅ **Grab** — **build the real GrabExpress adapter now.**
4. ✅ **Branding** — **logo + one accent color, unique per tenant**, plus a **banner image**
   (banner is preferred/"much better"). No template/theme step in the default path.
5. ✅ **Product import** — **manual first, with CSV + upload capability**; revisit FB/IG catalog
   ingestion afterward.
6. ✅ **Link strategy** — recommended option adopted: keep **`guma.one/{slug}`** as the canonical
   shop link, use the existing **per-product deep links** (`guma.one/{slug}/products/{productSlug}`)
   so a seller can answer "how much?" in a DM with a direct buy link, and add **short-link + QR
   generation** for bios/packaging. **Custom domains deferred** to the Pro/upsell tier — they add
   DNS+TLS ops burden and social sellers get no real benefit inside FB/IG/TikTok.

---

## 10. Immediate next step

Phase 0 is the only reversible-in-minutes, ship-today change and it removes the exact defect that
started this (mismatched vertical themes). Recommend landing Phase 0 first, then aligning on the
open decisions in §9 before Phase 1.
