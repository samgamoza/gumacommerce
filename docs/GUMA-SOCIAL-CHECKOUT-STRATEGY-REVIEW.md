
# Guma Commerce — Social-Commerce Checkout & AI Storefront Strategy Review

**Revision:** Full re-audit (2026-08-20), superseding both prior drafts of this document.
**Repository audited:** `D:\All Apps\gumacommerce` — this is the correction from the prior drafts, which audited a stale clone at `C:\Users\samga\gumacommerce` (same GitHub remote, `samgamoza/gumacommerce`, but six weeks behind: no CI, no `change_requests` governance table, no event bus, no delivery orchestrator, no Brand Guard, no suspend enforcement — all of which exist in this repo). Every finding below was re-derived from this repository; nothing from the prior drafts was carried forward without re-verification.
**Status:** Review and recommendation only. No application code, schema, dependencies, Git history, deployment, or external services were modified in this pass. No commands were run against any database, local or production.

---

## 0. What changed between drafts, stated plainly

Two things went wrong before this pass, and both are worth naming rather than quietly fixing:

1. **Wrong repository.** The first two drafts audited `C:\Users\samga\gumacommerce`. That checkout is real but stale — its own `docs/AGENT-HANDOFF.md` even references a different path (`D:\All Apps\guma-phase1.2\`) as the location of a related launch config, which should have been a signal to check for a more current checkout before writing 500+ lines of findings. It wasn't caught until the founder pointed it out directly.
2. **Verification-language overreach**, corrected in draft 2 and preserved here: **"Static-confirmed, runtime-unverified"** replaces "Verified" for any finding based only on reading code — this reviewer's sandbox cannot execute this repo's toolchain (broken `node_modules` symlinks when mounted here, no package-registry network egress), so nothing in this document has been run. **"Runtime-verified"** is reserved for behavior actually executed and observed; nothing currently qualifies for it. Where this document states something as fact about the codebase (a table exists, a function has a specific behavior, a comment says X), that is a static reading of the actual source, cited by file path — not a claim about what happens when it runs in production.

The real repository turned out to be substantially more mature than either prior draft assumed: it has a ratified Constitution, a binding AI-authority article, ADR-driven architecture decisions, a working event bus (Inngest), a working draft→approve→publish governance table (`change_requests`) spanning six business domains, a working multi-provider delivery orchestrator, a real test suite (23 files), CI, and a deterministic anti-AI-slop linter already in production. Most of what the earlier drafts "recommended as new work" already exists here, built by a prior session, in most cases more carefully than this reviewer's proposals were. That materially changes the shape of this document: it is now much more a **gap-and-tension audit against the repo's own stated direction** than a green-field architecture proposal.

---

## 1. Executive verdict

**What the repository already does well.** This is not a thin MVP. `packages/db/drizzle/` holds 18 migrations (`0000`–`0017`) building out tenants, catalog, orders, payments, wallet, KYC, delivery, a domain-event log (`0006_domain_events.sql`), a governance table (`0007_change_requests.sql`), a checkout-abandonment tracker (`0009_checkout_domain.sql`), a shipping domain, support/helpdesk tickets, and template intelligence tables. `docs/CONSTITUTION.md` and its binding companion `docs/CONSTITUTION-ARTICLE-VI-AI-PROMISE.md` define, in enforceable terms traced to specific files, exactly what AI may do automatically (only rewriting product-description *copy*, and only on paid plans), what requires human approval (everything customer-facing or financial — theme, pricing, SEO, checkout, shipping, publish), and what no one but a platform admin may do unattended (refunds — entrenched, not amendable). `ADR-0001` records eight binding decisions (keep Drizzle/no RLS for now, Inngest as the event transport, DDD-as-folders not microservices, one plan catalog, reuse `content_queue`'s draft→moderate shape rather than inventing new tables, defer heavy infra like ClickHouse/search engines until a named trigger fires) — this is a team that has already had, and resolved, most of the architectural debates this review would otherwise raise. A deterministic anti-AI-slop linter (`packages/storefront-themes/src/brand-guard.ts`) is live in CI (`.github/workflows/brand-guard.yml`) and in the Launch personalize flow, flagging fabricated stats, generic copy tropes, and un-allowlisted violet/indigo defaults — while explicitly *not* banning purple as a category (a curated "ube-cream" palette is allowlisted; the code comment says so directly). A multi-provider delivery orchestrator (`packages/services/src/delivery/orchestrator.ts` + adapters for Lalamove, Grab, manual, and a stubbed BayanGo hook) already exists, matching almost exactly what `docs/CHECKOUT-FIRST-OVERHAUL-PLAN.md` proposed a month earlier.

**The single most important finding in this review is not a missing capability — it's an unresolved fork in the product's own stated direction, and it goes directly to the primary goal you asked this review to evaluate.** `docs/CHECKOUT-FIRST-OVERHAUL-PLAN.md` (2026-07-21, status "Proposed," never marked adopted or rejected in any later doc) is the repo's own prior self-critique, and it reaches almost the identical diagnosis this review would otherwise write from scratch: the product had drifted into being "generate a themed website" when the actual job is "automate checkout on top of a seller's existing social presence." It proposed five phases: (0) stop force-mapping mismatched categories onto wrong vertical templates, (1) make a neutral, brand-light checkout surface the *default* render for `/{slug}` instead of one of ~20 vertical micro-sites, (2) build a real delivery orchestrator, (3) re-scope onboarding away from a template-picking wizard toward identify→products→payment→link, (4) build product import + shareable order links. **Phases 0 and 2 were built.** The delivery orchestrator is real (§2, §4A of the plan, confirmed in code). But **Phase 1 was not**: `apps/web/components/storefront/tenant-storefront-home.tsx` still dispatches to one of 20 named vertical renderers (`sweet-kitchen`, `bloom`, `sarab`, `aircon`, `studio`, `haircut`, …) by `pattern.storefrontRenderer`, falling back to `ThemedStorefrontHome` — not to any `CheckoutStorefront` the plan called for. And **Phase 3 was not**: `docs/ARCHITECTURE.md` (a living document, updated after the Checkout-First plan) still describes the current Launch flow as `/signup → /launch (DNA) → /launch/templates → /launch/personalize → /launch/preview → /launch/publish` — a template-picking wizard, unchanged in shape from what the plan diagnosed as the architectural flaw. Meanwhile, the most recent work documented in `docs/AGENT-HANDOFF.md` (session 2026-08-07→08, *after* the Checkout-First plan) went the other direction: it invested further in the template system — "Template Intel," AI-curated template skins, a stock-coverage dashboard, publish/archive workflow for template variants. That investment is not necessarily wrong (the plan itself, in its resolved decisions, kept vertical templates as "an optional paid upsell" — so continued investment in template quality for that upsell tier is defensible) — but **no document in this repository states, one way or the other, whether the default `/{slug}` experience for a brand-new tenant is still supposed to become the neutral checkout surface the plan called the actual product, or whether template selection has been re-adopted as the default path.** This is the one open question this review most needs the founder to resolve, because it determines almost everything else in this document's roadmap.

**Whether the current architecture can support the stated primary and secondary goals.** For the primary goal (simplest possible checkout automation, channel-independent), the underlying commerce core is solid and the delivery layer is genuinely more capable than most competitors surveyed (§4) — but the product's own default *entry point* is still the thing its own internal plan identified as the wrong artifact for that goal. For the secondary goal (free, non-generic AI storefronts), the governance rails (`change_requests`, Article VI) are unusually rigorous for this stage of a product, and the anti-slop linting is real — but it is scoped to Launch personalize copy and palette choice only; there is no cross-tenant similarity detection (the repo's own roadmap names this gap: "Brand Guard... Slice C (Workspace polish) not started").

**The three most important structural problems**, in order:

1. **The Checkout-First-vs-Template-Intel direction is unresolved**, and the default buyer-facing surface today is still the artifact the repo's own prior review called the wrong one for this product's stated mission. This is not this reviewer's opinion manufactured from outside — it is the repository's own documented, unresolved internal disagreement with itself.
2. **The concurrent-checkout stock race is real, unfixed, and self-acknowledged in the code**: `packages/db/src/queries/orders.ts:250` contains the comment `// row locked FOR UPDATE (deferred — see review remediation).` immediately before an unlocked stock read. `checkout_sessions` (§2) does not address this — its own code comment states its purpose is abandoned-checkout *detection*, not inventory reservation — so this gap is not covered by any other system already in place.
3. **A very large, long-uncommitted working tree** (571 modified files at this review's snapshot, plus a dirty embedded repo `simply-sweet-source`) that the repo's own Chief Engineer review already flags as a "High (ops)" risk ("commit/PR in slices before production cut") — a risk that compounds every day it's deferred, independent of anything else in this document.

**What should not be rebuilt.** The event bus (Inngest + `packages/events`), the `change_requests` governance table, the delivery orchestrator, the anti-slop linter, the plan catalog (`@guma-commerce/plans`), and the three-app/shared-packages topology are all sound, already-adopted-by-ADR, and should be extended, not replaced or duplicated. In particular: **do not build a second "content versioning" table or a second event/outbox system** — both already exist and are more thoroughly designed than what either prior draft of this review proposed.

---

## 2. Repository truth table

Status legend: **Static-confirmed** = read directly in this pass, in full, from the actual current source at the paths cited. **Partial** = a real but incomplete implementation, confirmed by reading. **Missing** = no code found for the capability. **Doc-claimed, not independently re-verified this pass** = stated as done/live in a repo doc (`ARCHITECTURE.md`, `AGENT-HANDOFF.md`, `CHIEF-ENGINEER-REVIEW-SUMMARY.md`) but this specific reviewer did not trace the code path in this pass, given the scope of everything else that needed direct verification — flagged so it isn't mistaken for either.

| Capability | Status | Evidence | Note |
|---|---|---|---|
| `change_requests` governance (draft→pending_review→approved/rejected→published→rolled_back), across theme/pricing/catalog/seo/checkout/shipping domains | **Static-confirmed** | `packages/db/drizzle/0007_change_requests.sql` — enum `change_request_domain` = theme/pricing/catalog/seo/checkout/shipping; enum `change_request_status` = draft/pending_review/approved/rejected/published/rolled_back; `before_json`/`after_json`, `reviewed_by`, `review_note`, `published_at` all present | This is exactly the governance layer both prior drafts proposed building — it already exists, and covers more domains than either draft's proposal did. No new table is needed. |
| Domain event log (Inngest-backed) | **Static-confirmed** | `packages/db/drizzle/0006_domain_events.sql` — `event_name`, unique `idempotency_key`, `correlation_id`, `payload_json`, `tenant_id`; `packages/events/src/{schemas,emit,client,functions}.ts` with tests (`checkout-events.test.ts`, `seo-events.test.ts`, `shipping-events.test.ts`) | Matches ADR-0001 D2's `Domain.Event.Vn` convention. The "minimal transactional outbox" either prior draft proposed already exists in a more considered form (this one has a real idempotency-key unique constraint at the DB level). |
| Event *consumers* fully wired end-to-end | Partial, per the repo's own admission | `docs/AGENT-HANDOFF.md` (2026-08-07→08 session): "Inngest consumers ticketed `INNGEST-001…004` (still acknowledge-only)" | Events are captured durably; what happens on the consuming side for at least four of them is still a stub. This is the real remaining event-infrastructure gap — not "build an outbox." |
| Checkout-abandonment tracking (`checkout_sessions`) | **Static-confirmed**, and its actual purpose is narrower than its name suggests | `packages/db/drizzle/0009_checkout_domain.sql` (table); `apps/web/app/api/checkout/session/route.ts`, code comment: *"Persist cart / checkout progress for abandoned-checkout detection."* | **Does not** reserve inventory, snapshot price, or gate order creation — it is a parallel telemetry write, not a precondition for `createOrderForTenant`. Anyone reading `ARCHITECTURE.md`'s "cart session" phrasing without checking the code would reasonably assume more than this actually does. |
| Order creation — server-authoritative pricing | **Static-confirmed** | `packages/db/src/queries/orders.ts`, `createOrderForTenant` | Unit prices re-derived from `products`/`productVariants`, not trusted from the client, in a DB transaction. |
| Oversell prevention under concurrency | **Missing, and self-acknowledged in the code** | `packages/db/src/queries/orders.ts:250`: `// row locked FOR UPDATE (deferred — see review remediation).` immediately above an unlocked stock read; decrement at line ~380 uses `greatest(stockQty - qty, 0)`, which floors at zero but does not prevent two concurrent reads from both passing the check | This is the single clearest, most precisely located, highest-confidence finding in this entire review. |
| Migration/journal drift | **Confirmed, same defect present in both this repo and the stale one** | `packages/db/drizzle/meta/_journal.json` entries: `[0,1,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]` — **idx 2 is missing**, even though `0002_nosy_ikaris.sql` exists as a file on disk | Verified by direct parse of the journal JSON in this pass, not carried over from the stale-repo finding by assumption. |
| Suspended tenant/user enforcement | **Static-confirmed, done** | `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md` §6: "✅ Ready — Seller writes hard-blocked; dashboard shows suspended notice; storefront 'unavailable'; checkout 403 `TENANT_SUSPENDED`"; corroborated directly in code: `apps/web/app/[tenantSlug]/page.tsx` renders a distinct "Shop unavailable" branch for `unavailable.kind === "suspended"` | Both prior drafts marked this "Missing" — that was correct for the stale repo and wrong for this one. |
| Anti-AI-slop linting (Brand Guard) | **Static-confirmed, live, deliberately non-categorical** | `packages/storefront-themes/src/brand-guard.ts`: rejects "not just X — it's Y" copy tropes and fabricated-scale-stat patterns as hard errors; **allowlists** curated palettes including a purple ("ube-cream") and only *warns* (not blocks) on an un-allowlisted custom hex matching a known AI-default indigo/violet; `.github/workflows/brand-guard.yml` runs it in CI | Both prior drafts spent significant effort designing a "kill-AI-slop spec" that either over-reached into categorical style bans (draft 1) or corrected that into a non-categorical design (draft 2's rewrite). The real implementation already embodies the non-categorical principle draft 2 argued for — it didn't need this review's correction, it already had it. |
| Cross-tenant/cross-store similarity detection | **Missing, and named as such by the repo's own roadmap** | `docs/ARCHITECTURE.md`: "Brand Guard (anti-slop) — **Next priority**... Slice C Workspace polish still deferred"; `docs/AGENT-HANDOFF.md` confirms Slice C not started | This is the one piece of either prior draft's anti-slop design (nearest-neighbor comparison, multi-dimensional similarity score, founder-configurable threshold, documented override) that is **not** yet built and could genuinely inform Slice C — see §10. |
| Delivery — multi-provider orchestration | **Static-confirmed** | `packages/services/src/delivery/orchestrator.ts` (+ `.test.ts`), adapters at `packages/services/src/delivery/adapters/{lalamove,grab,manual,bayango}-adapter.ts` | Matches `CHECKOUT-FIRST-OVERHAUL-PLAN.md` §4A's design almost exactly (adapter interface, `quoteAll`/orchestrated dispatch, BayanGo as a flagged stub that's never selected until real). Both prior drafts' "single-provider Lalamove only" finding was correct for the stale repo and wrong here. |
| Payments — production mock refusal | **Static-confirmed via doc, high-confidence** | `docs/MVP-HARDENING-P1-INTEGRATION-MOCKS.md`; `docs/ARCHITECTURE.md`: "Production never fakes PayMongo / Lalamove / SMS / AI success. Health: `GET /api/health/integrations`" | Not independently re-traced to the health-check route's exact logic in this pass, but corroborated by the existence of `packages/services/src/config/integrations.test.ts` and `packages/services/src/payments/paymongo-webhook.test.ts` in the real test suite. |
| Payments — current production default | **Static-confirmed via doc** | `docs/ARCHITECTURE.md`: "Default `PAYMENTS_MODE=manual_ewallet` until PayMongo is secured" | The live default today is a *manual* buyer-proof/seller-confirms e-wallet flow, not automated PayMongo settlement. This is a deliberate, documented interim posture, not a bug — but it means "payments are automated end-to-end" is not currently true in production by design, and any external claim to that effect (marketing copy, this review's own earlier drafts) overstated it. |
| AI authority model (Article VI) | **Static-confirmed** | `docs/CONSTITUTION-ARTICLE-VI-AI-PROMISE.md`; enforcement traced in the doc itself to `packages/ai/src/permissions.ts` (`ApprovalLevel`, `SCOPE_MATRIX`) and `packages/db/src/queries/change-requests.ts` | Not independently re-read line-by-line by this reviewer in this pass (the doc's own traceability section was treated as a strong but not exhaustively re-verified claim) — recommend a direct read of `permissions.ts` as a cheap, high-value follow-up given how central this is to the product's trust story. |
| Automated tests | **Static-confirmed, real and substantial** | 23 `*.test.ts` files found outside `node_modules`, spanning `packages/{db,events,ai,plans,services,storefront-themes}` — covering migration-journal drift, tenant-access/suspend, checkout/seo/shipping events, brand-guard, brand-kit, PayMongo webhook, delivery orchestrator, delivery webhook signatures, email fail-closed behavior | Both prior drafts' "zero tests anywhere" finding was correct for the stale repo and flatly wrong here. **No test was found specifically exercising the concurrent-checkout stock race** — the one area most needing one. |
| CI | **Static-confirmed** | `.github/workflows/brand-guard.yml` — scoped to Brand Guard only (storefront/brand-guard file paths), not a general typecheck/build/test-on-every-push pipeline | Real, but narrower than "CI" might imply — there is no evidence in this pass of a workflow that runs the full test suite or `tsc --noEmit` on every push/PR. |
| Working-tree state | **Static-confirmed** | `git status --short` at this review's snapshot: 571 modified files, 1 modified embedded repo (`simply-sweet-source`, no `.gitmodules` found, so likely a plain nested `.git` directory rather than a formal submodule) | `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md` independently flags this as a top risk ("Large uncommitted working tree \| High (ops)"). This review's own recommended Mission 000 (§13) is not a novel idea — it is this review agreeing with a risk the repo's own most recent internal review already named and had not yet acted on. |
| Constitution / ADR-0001 / Article VI compliance in code | **Not independently audited line-by-line in this pass** | — | Given the scope already covered, a full audit of whether every `SCOPE_MATRIX` entry in code actually matches Article VI's published table (§6.2) was not performed. This is a real, valuable, boundedly-scoped follow-up this review recommends but did not itself complete — see §14. |

---

## 3. Current architecture

### 3.1 Component map (per `docs/ARCHITECTURE.md`, cross-checked against `packages/` on disk)

```
apps/web        (:3010)  Buyer storefront + marketing, checkout, buyer chat, courier + payment webhooks
apps/admin      (:3001)  Seller: Launch, Appearance, Workspace (Pro+), products, orders, messages, settings
apps/platform   (:3002)  Super-admin: tenants, plans, users, helpdesk, moderation, frontends switch, audit

packages/db                 Drizzle schema + queries — includes change-requests, checkout, events-adjacent queries
packages/events              Event schemas + Inngest client + typed emit — commerce-scoped only (ADR-0001 D8: a separate "Guma OS" initiative exists; the boundary between them is explicitly unresolved)
packages/ai                   Prompt templates, plan-based model routing, SCOPE_MATRIX/permissions
packages/plans                  Canonical plan catalog (free/growth/pro → Free/Pro/Advance)
packages/auth                    Sessions, Google OAuth
packages/services                  PayMongo, delivery orchestrator + adapters, Semaphore SMS, email, rate limiting, integration health
packages/storefront-themes           Template catalog, brand-kit, Brand Guard linter, stock-skin system
packages/storefront-templates          (distinct from storefront-themes — not fully differentiated in this pass; a follow-up should clarify the split)
packages/ui, packages/media            Shared components / stub
```

### 3.2 Current checkout sequence (as read in code)

```
Buyer opens /{tenantSlug} → dispatches by pattern.storefrontRenderer to one of ~20 vertical
  renderers, or falls back to ThemedStorefrontHome (tenant-storefront-home.tsx) — NOT the neutral
  "CheckoutStorefront" the repo's own Checkout-First plan called for as the default (§1)
  → cart interactions optionally POST to /api/checkout/session, which upserts a checkout_sessions
    row purely for abandoned-checkout telemetry — this does not gate or feed order creation
  → "Checkout" → POST /api/checkout → createOrderForTenant (packages/db/src/queries/orders.ts):
       - single DB transaction, re-derives prices from products/productVariants
       - reads stockQty without a row lock (line ~250's own comment: deferred)
       - claims a per-tenant order number
       - inserts orders/order_items/order_status_history
       - decrements stockQty via `greatest(stockQty - qty, 0)` — floors at zero, does not
         prevent two concurrent buyers of the last unit both succeeding
  → COD / manual e-wallet (current production default) → seller manually confirms payment proof
    non-COD, PayMongo mode active → PayMongo PaymentIntent + webhook confirmation (webhook has
    its own test coverage: packages/services/src/payments/paymongo-webhook.test.ts)
```

### 3.3 Current storefront-generation sequence (as read in `docs/ARCHITECTURE.md`, cross-checked against the Launch flow reference)

```
/signup → /launch (Store DNA: name, category, vibe, audience, product count, goals)
        → /launch/templates (recommendTemplates(dna) scores ~27 vertical themes; seller picks one)
        → /launch/personalize (tagline, promo copy, colors, palette — validated live against
          Brand Guard's copy/palette rules, packages/storefront-themes/src/brand-guard.ts)
        → /launch/preview
        → /launch/publish — creates + approves + publishes a THEME change_request, writes an
          audit row, emits Theme.Published.V1 / Store.Published.V1 via packages/events
```

This is a real, working draft→approve→publish pipeline with real audit and event emission — it is not the "direct save, no governance" pattern either prior draft of this review (correctly, for the *other* repo) described. The open question (§1) is not whether this pipeline is governed — it is — but whether *template selection* should still be the center of it, per the repo's own unresolved internal debate.

### 3.4 Systems of record, human-approval boundaries, audit

Neon Postgres remains the sole system of record. Human-approval boundaries are substantially broader than either prior draft found: Article VI's `SCOPE_MATRIX` (as documented) covers theme, pricing, SEO, checkout, shipping, and bulk-catalog changes at `human_review` or stricter on every plan, with refunds entrenched at `admin_only` and not amendable. Audit is unified around `platform_audit_log`'s column shape (ADR-0001 D7), extended with `tenant_id` and `actor_type` rather than a second table — exactly the "extend, don't duplicate" instinct this review would otherwise have had to recommend from scratch.

---

## 4. Competitive comparison matrix

This section's external research (market facts about competitors, not this repository) is materially unchanged from the prior draft — the market didn't move between drafts, only the understanding of Guma's own repo did. Carried forward with re-contextualization where the real repo's actual posture changes the comparison.

### 4.1 PayMongo Storefront AI — still the closest direct competitor

**[primary]** [paymongo.com/products/accept-payments/storefront-ai](https://www.paymongo.com/products/accept-payments/storefront-ai), fetched 2026-08-20. Natural-language full store generation, PayMongo Checkout built in (GCash/Maya/GrabPay/ShopeePay/QRPh/BillEase BNPL/cards), an explicit "Set Up → Design with AI → Preview, regenerate, publish" flow, ₱349/month beta pricing (not free), ₱50-for-3-prompts regeneration credits.

**This finding changes materially now that the real repo's Constitution is known.** `docs/CONSTITUTION.md` states GUMA Launch should "**install** curated templates; **personalize** them — do not generate layouts/CSS/components with AI." That is a *deliberate, constitutional, already-adopted* strategic choice to **not** compete with PayMongo Storefront AI on natural-language full-generation — not a gap this review needs to recommend closing. The real differentiation question is no longer "should Guma generate stores with AI like PayMongo does" (the Constitution already says no) — it is whether Guma's actual default experience is a checkout-first surface (which PayMongo Storefront AI's own documentation does not claim to offer — it frames everything around "customers browse your products, add to cart, check out" on the generated store itself, not portable channel-independent links) or a template-picking wizard that, per §1, still competes on the exact ground the Constitution says not to compete on.

### 4.2 ChatGenie — in-app conversational commerce

**[primary]** [chatgenie.ph](https://chatgenie.ph/), fetched 2026-08-20. In-app commerce inside Messenger/Instagram/Viber/GCash, Copilot AI comment-to-link automation, real-time Grab Express/Pandago/Ninja Van booking, flat ₱10/transaction fee (no commission). The site's current primary positioning has shifted toward an enterprise agentic-support product, but the e-commerce section remains live and documented.

Unchanged assessment from the prior draft: ChatGenie made the opposite architectural bet from channel-independent links — deep native integration *inside* each chat surface. Guma's delivery orchestrator (§2) is a genuine capability edge here (multi-provider auto-select/failover vs. ChatGenie's fixed Grab Express/Pandago/Ninja Van set), but Guma has no comment-to-link or DM-to-link automation of any kind today, which is exactly ChatGenie's core mechanism.

### 4.3 Other products (carried forward, source labels preserved from the prior correction pass)

Shopify cart permalinks **[primary]**, Ecwid's Meta-registered checkout link **[primary]**, PayMongo Payment Links **[primary]**, WhatsApp Business Platform catalog+cart **[primary]**, Lalamove Delivery API v3 **[primary]** — all unchanged findings, since these are external facts about other companies, not about this repository. Stan Store/Beacons/Fourthwall/CommentSold/SleekFlow pricing and feature claims remain **[secondary]**-labeled (third-party comparison sources, not the vendors' own pages) — unchanged from the prior correction.

---

## 5. Checkout idempotency — current state and remaining gap

`domain_events` (§2) already has a unique `idempotency_key` constraint at the database level — real, durable idempotency infrastructure exists for the *event* layer. What was not verified in this pass, and should be treated as open rather than assumed either way, is whether `POST /api/checkout` itself (the order-creation request, not the abandonment-tracking session request) has an equivalent client-supplied idempotency key checked before `createOrderForTenant` runs. Given the concurrency finding in §2 already shows the order-creation path lacks a row lock on its stock read, a double-submitted checkout request has the same failure shape as two genuinely concurrent buyers — so whatever this repo's answer turns out to be, it should be fixed in the same pass as Mission 001 (§13), not treated as a separate, lower-priority item.

---

## 6. Inventory model — the gap this review can still usefully specify

Nothing found in this pass supersedes the concurrency finding in §2, and `checkout_sessions` (§2) does not double as an inventory-reservation mechanism despite superficially adjacent naming. The `onHand`/`reserved`/`committed`/`availableToSell` model with `released`/`restored` ledger events, specified in full in the prior correction pass, remains a valid, still-needed piece of design work — carried forward here rather than re-derived, since nothing in this pass changed its rationale:

| State | Meaning |
|---|---|
| `onHand` | Seller's physical count — changes on seller restock/adjustment, and once automatically at fulfillment completion |
| `reserved` | Soft-held by an open, TTL-bound checkout flow |
| `committed` | Allocated to a confirmed-but-unfulfilled order (COD accepted, or online order within its payment window) |
| `availableToSell` | Derived, never stored: `onHand − reserved − committed`, floored at 0 |
| `released` (event) | `reserved`/`committed` → 0, goods never left — session expiry, cancellation, payment failure/timeout |
| `restored` (event) | `committed` → 0 via a post-fulfillment refund, gated on seller-confirmed resellable return |

**What's different this time:** this model should be built as an extension of the real `checkout_sessions`/`domain_events`/`change_requests` infrastructure that already exists, not as a parallel system. Concretely: a `checkout_session`'s `status` transitions and the proposed `reserved`/`committed`/`released`/`restored` ledger events are natural `domain_events` entries (already have the right shape: `idempotency_key`, `correlation_id`, `tenant_id`), and the fix belongs in `createOrderForTenant` directly, not a new service layer.

---

## 7. Governance and versioning — already solved, do not duplicate

Both prior drafts spent significant space designing a `content_versions` table and arguing for why existing objects (`content_queue`, `platform_audit_log`, KYC sessions) couldn't serve as a general approval workflow. That reasoning is now moot: `change_requests` (§2, §3) already is that table, already typed by a closed `change_request_domain` enum (not an open string), already covers theme/pricing/catalog/seo/checkout/shipping, already has `before_json`/`after_json` for rollback, and is already the explicitly-designated "Crown Jewel" per ADR-0001 D5, which itself states: "**Do not** invent parallel tables/enums for 'drafts' or 'audit' — extend the established ones." **This review agrees with that instruction and has nothing to add to it beyond urging that any new domain (e.g., a future channel-link or QR-code capability) be added as a new `change_request_domain` enum value, not a new table.**

---

## 8. Kill-AI-slop — what's real, and what Slice C still needs

`brand-guard.ts` (§2) is a genuinely well-designed, deterministic, zero-LLM linter already doing almost exactly what the prior correction pass argued an anti-slop system should do: no categorical style ban (a purple palette is allowlisted), hard-reject on fabricated stats and generic copy tropes, soft-hint on emoji density and vague marketing language ("revolutionary," "seamless," "elevate your"), wired into CI and the live Launch flow. This does not need correcting.

**What it does not do, and what the repo's own roadmap names as the open next step (Brand Guard "Slice C — Workspace polish," not started):** cross-tenant similarity detection. The prior correction pass's design for this — a transparent score, named nearest-comparable-stores, the specific dimensions responsible (layout fingerprint, token distance, typography, copy similarity), suggested regeneration options, a founder-configurable threshold, and a documented merchant/founder override — remains unbuilt and is offered here as a concrete starting specification for Slice C, not as a competing system to what already exists. It should be built as a `change_requests`-domain-aware check (likely a new `template` or `theme` sub-check run before a theme `change_request` reaches `pending_review`), not a parallel gate.

---

## 9. Architectural fitness assessment

| Dimension | Rating | Reasoning |
|---|---|---|
| Universal social checkout | **Weak, and the repo's own prior review already reached this conclusion** | The delivery layer is strong; the entry point is still template/vertical-storefront-first, which `CHECKOUT-FIRST-OVERHAUL-PLAN.md` itself names as the wrong artifact for this goal. No shareable multi-item cart link, QR, or DM-to-link mechanism was found. |
| Philippine payments | **Adequate, honestly scoped** | GCash/Maya/QRPh/COD via PayMongo when active; manual e-wallet is the documented current production default until PayMongo is "secured" — an honest interim posture, not a gap to hide. |
| Reliability | **Adequate-to-weak, mixed** | Real test suite and CI exist (a genuine strength relative to either prior draft's assumption), but the highest-severity known bug (concurrency) has no test, and the working tree is 571 files uncommitted. |
| Tenant isolation | **Adequate, app-layer, per ADR-0001 D1 deliberately not DB-enforced** | A conscious, documented decision (not an oversight), revisit only on a signed compliance trigger per the ADR's own terms. |
| Human control | **Strong** | Article VI is the most rigorous AI-governance specification found in either research pass across all competitors surveyed in §4 — none of PayMongo Storefront AI, ChatGenie, or the other comparators publicly document anything this specific. |
| Extensibility | **Strong** | `change_requests`' domain enum, `packages/events`' versioned naming convention, and the delivery adapter interface are all designed to extend cleanly. |
| Store-generation quality / anti-slop | **Adequate, narrower than it looks at first read** | Real and non-categorical (§8), but Launch-copy-and-palette-scoped only; no cross-store similarity check yet. |
| Operational simplicity | **Strong, deliberately preserved** | ADR-0001 D6 explicitly defers ClickHouse, dedicated search, Vault, and a plugin marketplace until named triggers fire — this review found no evidence any of those triggers have fired. |
| Strategic coherence | **Weak — new dimension added this pass** | The Checkout-First-vs-Template-Intel fork (§1) is not a technical weakness, it's a direction-setting one, and it is currently unresolved in any document this review found. |

---

## 10. Gap analysis

**Structural/strategic:** the Checkout-First-vs-Template-Intel fork (§1) is the standout item — not previously named as a "gap" in either prior draft because neither draft knew this repo, or this internal debate, existed.

**Checkout/inventory:** the concurrency race (§2, precisely located); unconfirmed idempotency on the order-creation request specifically (§5); `checkout_sessions` not (yet) feeding a reservation model (§6).

**Event infrastructure:** consumer-side handling for at least four ticketed Inngest consumers is still acknowledge-only (§2) — the capture side is solid, the reaction side is not finished.

**Anti-slop:** cross-tenant similarity detection not built (§8), named by the repo's own roadmap, not invented by this review.

**Documentation/process:** the working tree is 571 files uncommitted, a risk the repo's own most recent Chief Engineer review already flagged as high-severity and unresolved (§1, §13).

**Not re-examined in this pass, flagged rather than assumed:** KYC review-queue and wallet/payout ops UI (both noted in `AGENT-HANDOFF.md` as still missing on the Platform side); the exact `packages/storefront-themes` vs. `packages/storefront-templates` split; whether `SCOPE_MATRIX` in code exactly matches Article VI's published capability table (§3.4).

---

## 11. Prioritized roadmap

**Above P0 — a decision, not a mission:** resolve the Checkout-First-vs-Template-Intel direction (§1). Nothing else in this roadmap should be treated as final sequencing until this is answered, because it changes whether Mission-shaped work after Mission 001 should extend the template/Launch-wizard system or replace its default path with a neutral checkout surface.

**P0 — required before other work is trustworthy:**
0. **Mission 000 — Repository Preservation and Executable Baseline** (§13), now against 571 modified files and a dirty embedded repo, not the smaller figure the stale-repo draft described. If anything, more urgent here than previously stated.
1. **Mission 001 — Concurrent Checkout Stock Safety** (§13), now precisely located at `packages/db/src/queries/orders.ts:250` with the team's own deferral comment as corroborating evidence.
2. Confirm/close the checkout-order idempotency gap (§5) in the same pass as Mission 001.
3. Reconcile the `0002_nosy_ikaris.sql` / journal-index-2 drift (§2) — confirmed present in this repo too, not fixed here, not carried over by assumption from the other one.

**P1 — depends on the strategic decision above:**
4. If the neutral-checkout-surface direction is reaffirmed: implement Checkout-First Overhaul Plan Phase 1 (default `CheckoutStorefront`) and Phase 3 (re-scoped onboarding), reusing the existing `change_requests`/Launch-publish pipeline rather than building a new one.
5. If template-first is reaffirmed instead: update `docs/ARCHITECTURE.md` and `docs/CHECKOUT-FIRST-OVERHAUL-PLAN.md` explicitly to reflect that decision, so the next agent or contributor doesn't rediscover this same fork the way this review just did.
6. Build the inventory model (§6) inside `createOrderForTenant`, emitting `reserved`/`released`/`committed`/`restored` as `domain_events`.
7. Fill the ticketed Inngest consumer stubs (`INNGEST-001…004`).
8. Cross-tenant similarity detection for Brand Guard Slice C (§8).

**P2:** shareable cart/checkout links and QR codes (named in the Checkout-First plan's resolved decisions, not yet built per this pass's findings); comment/DM-to-link automation (ChatGenie's core mechanism, §4.2, genuinely absent here).

**Deferred, per the repo's own ADR-0001 D6, unchanged by this review:** ClickHouse, dedicated search, pgvector-at-scale, a plugin marketplace, a secrets vault — no evidence any named trigger has fired.

**Rejected:** a second governance/versioning table (§7); a second event/outbox system (§2); natural-language full AI store generation (explicitly foreclosed by `CONSTITUTION.md`, §4.1); microservice decomposition (ADR-0001 D3).

---

## 12. ADR recommendations

1. **A new ADR (or an amendment to `CHECKOUT-FIRST-OVERHAUL-PLAN.md` itself) explicitly resolving the neutral-checkout-vs-template-first direction (§1)** — this is the single highest-value governance action this review recommends, and it costs nothing but a decision.
2. An ADR for the inventory model (§6) — `onHand`/`reserved`/`committed`/`availableToSell`, expressed as `domain_events`, consistent with ADR-0001 D2's existing conventions.
3. An ADR (or a line in Article VI's traceability section) confirming whether `checkout_sessions` is intended to remain telemetry-only, or whether it should be renamed/extended once it does take on a reservation role, to avoid the exact misreading this review nearly made from `ARCHITECTURE.md`'s "cart session" phrasing alone.

---

## 13. Implementation missions

**Neither mission below has been implemented in this pass. Both await founder authorization.**

### Mission 000 — Repository Preservation and Executable Baseline (recommended for immediate execution)

Unchanged in structure from the prior correction pass, re-scoped to this repository's actual numbers:

- Inventory and classify the **571 modified files** and the dirty `simply-sweet-source` embedded repo (no `.gitmodules` found — confirm whether this should be a real submodule, a subtree, or ignored entirely, before deciding how to checkpoint it).
- Confirm which storefront path is actually intended as default — this mission should explicitly surface the §1 fork as a founder decision item, not resolve it.
- Repair dependencies and run the *actual* declared toolchain (`pnpm --filter @guma-commerce/{db,web,admin,platform} exec tsc --noEmit`, per `docs/AGENT-HANDOFF.md`'s own "should be green" command list) on the real development machine — this reviewer's sandbox cannot do this (§0).
- Reconcile the `0002` journal gap via read-only inspection against live Neon.
- Confirm the `PAYMENTS_MODE` and integration-health boundary in the actual deployed environment, not just the doc claim.
- Propose (do not execute without approval) a checkpoint/commit strategy for the 571-file delta.
- **Do not** discard, reset, or clean any user changes. **Do not** commit or push without explicit founder authorization. **Do not** run `db:push` (explicitly, repeatedly forbidden across every doc in this repository).

Acceptance criteria: all source changes accounted for; a recoverable checkpoint plan approved by the founder; toolchain confirmed to actually run; migration truth reconciled or the precise blocker documented; the §1 fork surfaced as an explicit open decision, not silently resolved either way; no user work lost; no production database mutated; no deployment occurs.

### Mission 001 (queued behind Mission 000) — Concurrent Checkout Stock Safety

- **Objective:** Close the gap at `packages/db/src/queries/orders.ts:250`, replacing the unlocked read-then-decrement with a single atomic conditional update per line (`UPDATE product_variants SET stock_qty = stock_qty - :qty WHERE id = :variantId AND stock_qty >= :qty RETURNING stock_qty`; roll back the whole order transaction if any line returns zero rows).
- **In the same pass, confirm or add:** an idempotency key on the order-confirmation request itself (§5), since a double-submitted request has the identical failure shape to the concurrency bug and fixing one without the other leaves the door half-closed.
- **Required test:** a real, executed concurrent integration test against disposable Postgres, firing two genuinely simultaneous `createOrderForTenant` calls against `stockQty = 1`, confirming exactly one succeeds. A mocked-repository unit test is not accepted as proof, consistent with the prior correction pass's instruction on this point.
- **Explicit exclusions:** the full `onHand`/`reserved`/`committed` model (§6) is separate, larger, later work; this mission fixes concurrency for the existing single-counter model only.

---

## 14. Unknowns and founder decisions

**The one decision that gates almost everything else:** is the neutral, checkout-first storefront surface (Checkout-First Overhaul Plan, Phases 1 and 3) still the intended default experience, or has continued investment in Template Intel superseded that plan? Neither this review nor any document found in the repository currently answers this.

**Recoverable from the repository, not yet done in this pass:**
- Whether `SCOPE_MATRIX` in `packages/ai/src/permissions.ts` exactly matches Article VI's published capability table (§3.4, §10).
- The precise difference in scope between `packages/storefront-themes` and `packages/storefront-templates`.
- Whether `POST /api/checkout` (order confirmation) has its own idempotency-key check, distinct from `domain_events`' event-level idempotency (§5).
- Whether `simply-sweet-source` should be a real Git submodule, a subtree, or dropped from version control entirely (§13).
- Whether the toolchain actually builds/typechecks/tests green on a real machine — unverifiable from this sandbox (§0).

**Actual business/founder decisions:**
- The Checkout-First-vs-Template-Intel direction, named above, first.
- Reservation TTL and payment-window-timeout durations for the inventory model (§6), unchanged as an open question from the prior draft.
- Whether `checkout_sessions` should be extended into a reservation mechanism or kept strictly as abandonment telemetry with a separate mechanism built alongside it (§6, §12).
- The Brand Guard Slice C similarity threshold and override policy (§8), founder-configurable by design.
- The `packages/events` vs. the separate "Guma OS" event bus boundary, explicitly named as unresolved in ADR-0001 D8 itself — not a gap this review discovered, but one worth re-surfacing given how central events now are to this architecture.

---

## 15. Explicit confirmation

**No application code, schema, dependency, Git history, configuration, deployment, or external service was modified by this review, in this pass or either prior one.** Every command executed was read-only (`git status`, `git log`, `git diff --shortstat`, file reads, a JSON parse of the migration journal, and grep/find searches). No database, local or production, was queried, migrated, or mutated. Nothing was deployed. Mission 000 is recommended for immediate execution; Mission 001 is queued behind it. Neither has been started. This document awaits founder review.
