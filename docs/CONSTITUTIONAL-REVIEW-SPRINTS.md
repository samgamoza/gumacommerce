# Constitutional Review — Sprints 1–5

**Reviewer:** Claude (architectural review)
**Date:** 2026-07-13
**Authority applied:** GUMA Constitution v2.0 (Articles I–XV) — *supreme*; Handbook v1.2.
**Companion:** [`CONSTITUTIONAL-REVIEW-CROWN-JEWEL.md`](CONSTITUTIONAL-REVIEW-CROWN-JEWEL.md) — the shared draft→approve→publish rails. Findings **H1–H3** there (non-atomic publish, bypassable approval gate, post-hoc event emission) apply to the *config-publish* path of Sprints 1–3 and are **not repeated here**. This document reviews the **new domain logic** each sprint added.
**Sprints:** 1 SEO · 2 Checkout · 3 Shipping · 4 Plan Catalog (ADR D4) · 5 Priority Template Ports.

---

## 1. Verdict

**The sprints are architecturally disciplined and, in the money-handling core, genuinely well built.** The strongest constitutional signal is what the team *didn't* do: every sprint reused the single `change_requests` rail and the single plan catalog instead of forking a parallel engine — each DoD explicitly states *"No parallel approval engine."* That is Article XI (simplicity, reuse) and Article XIV (long-term platform thinking) honored in practice, not just prose.

The order-placement path (Sprint 2) is the high-water mark: **server-authoritative pricing from the DB, integer-centavo math, a real DB transaction, atomic order-number allocation, and server-resolved delivery fees.** A buyer cannot forge a price, a discount, or a free-shipping fee. This is exactly the Trust-by-Design (Article V) the Constitution demands — and it proves the H1 gap in the publish rails is an oversight, not a capability gap: the team knows how to write transactions; the crown-jewel publish path simply doesn't.

**The weaknesses are "built but not fully wired" gaps** — configuration surfaces that accept settings the runtime then ignores. None is a security hole; each is a *trust* erosion, because the merchant is shown a control that does nothing:

- Coupon **`maxRedemptions` is accepted, validated, and stored — but never enforced** (Sprint 2).
- Shipping **zone-based rates are configurable but bypassed at charge time** because the buyer address is never threaded into the fee resolver (Sprint 3).
- Shipping **weight-band rates never receive a weight**, so they collapse to the zero-band (Sprint 3).

Fixing these is small work and high trust-value.

---

## 2. What strengthens the architecture (keep)

| # | Strength | Article | Evidence |
|---|----------|---------|----------|
| S1 | Every sprint reuses the CR rail + plan catalog; **no parallel workflow engines** | XI, XIV | Sprint DoDs; `change_requests` single table |
| S2 | Order totals recomputed **server-side from DB prices**, never trusted from client | V, XII | `orders.ts:197` (`toCentavos(row.basePrice)`) |
| S3 | Money math in **integer centavos**; order creation fully **transactional**; order numbers row-locked | V, X, XII | `orders.ts:151,197,243` |
| S4 | Delivery fee **server-resolved** (live courier quote or published-config resolver), never client-supplied | V, XII | `web/app/api/checkout/route.ts:248`, `storefront-settings.ts:160` |
| S5 | Storefront consumes **published** SEO/checkout/shipping JSON only (draft never leaks live) | III, VI | `route.ts:186` reads `shippingPublishedJson`; SEO/checkout mirror |
| S6 | Plan catalog is a **single canonical source** with correct alias normalization + tests | XI, XIV | `packages/plans/src/catalog.ts:125`, `catalog.test.ts` |
| S7 | Normalizers are defensive (`normalizeCheckoutJson`, `normalizeShippingJson`) — bad input degrades to safe defaults | V, XI | `tenant-checkout.ts:97`, `tenant-shipping.ts:255` |

---

## 3. Findings (new domain logic)

Rails findings (publish atomicity, approval gate, event emission, hardcoded `plan="free"` in `seo/submit` and `checkout/submit`) are in the companion doc as **H1, H2, H3, M1** and also burden Sprints 1–3.

### C1 — Coupon `maxRedemptions` is never enforced (Sprint 2) — **MEDIUM** (Article V)
> **Status: ADDRESSED 2026-07-13.** `createOrderForTenant` now counts prior orders bearing the coupon code (per tenant, inside the order transaction) and throws `OrderError("…redemption limit.", "COUPON_LIMIT_REACHED")` when the cap is hit, but only when the coupon would actually apply (`packages/db/src/queries/orders.ts`). Remaining caveat: under READ COMMITTED, two same-coupon checkouts racing within the same instant can each pass the count — a soft cap with a narrow over-redemption window. A hard guarantee (dedicated counter row locked `FOR UPDATE`, or a unique redemption constraint) is deferred.

**Where:** Defined `tenant-checkout.ts:10`; validated `apps/admin/app/api/checkout/route.ts:15`; normalized/preserved `tenant-checkout.ts:92`. **No enforcement:** `findActiveCoupon` (`:175`) and `computeCheckoutTotals` (`:204`) never check a redemption count, and the order path (`orders.ts:225`) inserts no coupon-usage record and reads no counter.
**Failure scenario:** A merchant creates `SAVE50` with `maxRedemptions: 100`. The 101st, 500th, and 5,000th buyers all receive the discount. The cap is a decorative control.
**Constitutional breach:** Article V (Trust by Design — "predictable"): the merchant configured a limit the system silently disregards. Also brushes Article II (merchant owns pricing/commitments) — a promotion they thought was bounded is unbounded.
**Remediation:** Track redemptions (a `coupon_redemptions` row or an atomic per-coupon counter incremented inside the order transaction), and reject/ignore the coupon in `computeCheckoutTotals` once the cap is reached. Enforce inside the `orders.ts` transaction so concurrent checkouts can't race past the cap.

### C2 — Shipping zone rates bypassed at charge time (Sprint 3) — **MEDIUM** (Article V)
> **Status: ADDRESSED 2026-07-13.** The buyer's `city`/`barangay`(`/postalCode`) is now threaded into `computeDeliveryFee` at both the charge path (`web/app/api/checkout/route.ts`) and the display path (`components/checkout-form.tsx`), so `resolveShippingFee` performs real zone matching for the charged and shown fee. Verified against existing `resolveShippingFee > matches city zone rates` unit test. (Province is not collected by the checkout form, so province-only zones still won't match until that field is added.)

**Where:** `resolveShippingFee` supports full zone matching (`tenant-shipping.ts:419,515`), but both callers invoke `computeDeliveryFee(subtotal, settings)` **without the address argument** — order path `web/app/api/checkout/route.ts:251` and display `components/checkout-form.tsx:185`. `computeDeliveryFee`'s 3rd param (`address`) exists (`storefront-settings.ts:158`) but is never passed.
**Failure scenario:** A merchant configures Metro Manila ₱89 / provincial ₱180 zones. Because no address reaches `zoneMatches`, every buyer resolves to the default/first band regardless of location. For non-Lalamove (manual/flat) shops the charged fee ignores the zone table entirely.
**Constitutional breach:** Article V (predictable/permission-aware) and Article IV (the fee shown/charged can't be explained by the config). Sprint 3's headline capability — profiles·zones·rates — is inert for the charged fee.
**Remediation:** Thread the buyer's `city/barangay/province/postalCode` into `computeDeliveryFee`/`resolveShippingFee` at both the display and order-creation call sites. Add a test asserting a provincial address yields the provincial band.

### C3 — Weight-band rates never receive a weight (Sprint 3) — **LOW** (Article V)
**Where:** `resolveShippingFee` reads `input.weightKg ?? 0` (`tenant-shipping.ts:534`); no caller supplies `weightKg`, and products carry no weight into the resolver. In `pickRateAmount` (`:444`), a `weight`-basis rate evaluates `value = 0`, matching only the band containing 0.
**Effect:** Weight-based shipping collapses to the lowest band. Additionally, `pickRateAmount` returns the *first* `flat`-basis rate encountered before evaluating later bands (`:456`), so rate ordering can shadow bands.
**Remediation:** Either carry product weight through checkout into the resolver, or hide the weight basis in the UI until it's wired. Make `pickRateAmount` evaluate all bands before falling back to flat.

### C4 — Two shipping code paths, easy to drift (Sprint 3) — **LOW** (Article VII/XI)
`computeDeliveryFee` wraps `resolveShippingFee` (good — one resolver), but the order route also branches to `getLalamoveCheckoutQuote` first (`route.ts:246`) and falls back to `computeDeliveryFee`. The *charged* fee and the *displayed* fee are computed by structurally different expressions (`checkout-form.tsx:185` vs `route.ts:248`). They agree today but there is no shared function guaranteeing it.
**Remediation:** Extract one `quoteDelivery(tenant, cart, address, fulfillment)` used by both display and order creation so buyer-shown and buyer-charged fees are provably identical.

### C5 — Ported templates: verify tenant-data binding (Sprint 5) — **LOW / verify** (Article VII)
The `aircon/carserv/motto/studio` React renderers show **no hardcoded secrets or tenant coupling** (clean — grep clean), and dispatch is registry-driven. Not verified in this pass: whether each renderer is fully **data-bound to real tenant products/theme tokens** or still partly static demo content (`apps/web/lib/demo-data.ts`). A template that renders static copy for a live tenant would violate Article VII (the storefront must reflect the tenant's own domain data).
**Remediation:** Confirm each ported renderer reads tenant products/branding for a non-demo tenant; flag any static sections.

---

## 4. Per-sprint scorecard

| Sprint | Domain | New-logic verdict | Notes |
|--------|--------|-------------------|-------|
| 1 | SEO | ✅ Solid | Published-only consumption; defensive normalize. Inherits rails H1–H3 + hardcoded `free` (M1) in `seo/submit`. |
| 2 | Checkout | ✅ Strong (best area) | Server-authoritative, transactional, centavo-safe. **C1** (maxRedemptions) is the one real gap. Inherits H1–H3 + M1. |
| 3 | Shipping | ⚠️ Built-but-unwired | Rich model, server-resolved fee, but **C2/C3** leave zone/weight pricing inert; **C4** dual paths. Inherits H1–H3. |
| 4 | Plan Catalog | ✅ Exemplary | Single source of truth, correct aliases, safe `free` default, tested. Model for Articles XI/XIV. |
| 5 | Template Ports | ✅ Low-risk | Registry-driven, no leakage. **C5** data-binding to verify. |

**Cross-cutting Article read:** II ✅ (nothing auto-charges/auto-publishes) · V ⚠️ (C1/C2/C3 are trust erosions) · VI ✅ for consumption, ⚠️ inherited H3 for emission · XI ✅ (reuse discipline) · XII ✅ (server-authoritative money, tenant-scoped) · XIV ✅ (rails/catalog extend cleanly).

---

## 5. Prioritized remediation (sprint-specific)

1. ~~**C1** — enforce `maxRedemptions` inside the order transaction~~ **✅ done 2026-07-13** (soft cap; hard-guarantee counter deferred).
2. ~~**C2** — thread buyer address into the fee resolver at display + order creation~~ **✅ done 2026-07-13** (province field still to add).
3. **C4** — unify displayed vs charged delivery fee behind one function.
4. **C3** — wire product weight or hide the weight basis.
5. **C5** — verify template data-binding for live tenants.

These are independent of, and smaller than, the rails fixes (H1–H3) in the companion review. Sequence: land H1 (transactional publish) and C1 (coupon cap) together — both are "make the safety control actually hold" fixes and both belong inside a DB transaction.

---

## 6. One-line summary for the founder

*Sprint 2 shows the team can build trust-grade money handling; Sprints 1/4/5 reuse the rails with real discipline. The gap is a handful of merchant-facing controls (coupon caps, shipping zones) that are configurable but not yet enforced — cheap to close, and closing them is what makes "human-led commerce" true at the checkout line.*
