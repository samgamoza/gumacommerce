# GUMA ai-Commerce — Constitutional Refactoring Assessment

**Version:** 1.0  
**Date:** 2026-07-12  
**Status:** Pre-implementation — awaiting approval  
**Constitution source:** Cursor Master Prompt — GUMA ai-Commerce Constitutional Refactoring  
**Codebase:** `D:\All Apps\gumacommerce`  
**Companion docs:** `docs/COMPREHENSIVE-HANDOFF-2026-07-12.md`, Handbook v1.2

---

## Guiding question

> *Does this make commerce simpler for merchants while preserving their control?*

Every recommendation below is scored against that question.

---

# Deliverable 1 — Architecture Assessment

## 1.1 Current state summary

Guma Commerce is a **working modular monolith**: three Next.js 15 apps (`web`, `admin`, `platform`) sharing Drizzle-backed packages. It is **not** a Shopify clone in implementation — it is closer to a **storefront + seller admin + AI content tools** stack with strong PH commerce integrations (PayMongo, Lalamove, COD, wallet).

| Layer | Current | Constitutional target |
|-------|---------|---------------------|
| **Launch experience** | Signup → auto brand kit → onboarding checklist → Shop Builder (later) | GUMA Launch: Business Profile → Store DNA → Top 3 templates → pick → personalize → preview → publish |
| **Workspace experience** | AI Studio + Agents + Shop Builder (disconnected) | GUMA Workspace: unified AI ops with plans, diffs, approval, rollback |
| **Templates** | Pattern + TSX renderers + token themes; partial metadata | Reusable commerce packages with rich metadata + scoring engine |
| **AI placement** | LLM in chat, agents, generation; **deterministic brand kit at signup** ✅ | Rules first; LLM in Workspace only where justified |
| **Human control** | Product draft/active; content_queue draft→approved; **no theme draft/publish** | Draft → Preview → Approve → Publish for all significant changes |
| **Events / DDD** | Logical package split; synchronous APIs; `packages/events` stub | Inngest event bus; explicit bounded contexts |
| **Plugins** | Provider stubs in `services` | Manifest-based extension framework (future) |

## 1.2 Architectural strengths (retain)

1. **`deriveBrandKit()`** — Zero-LLM deterministic personalization at signup. **Fully constitutional** for GUMA Launch economics and philosophy.
2. **`matchStorePattern()` + category hints** — Rule-based vertical matching. Foundation for Template Recommendation Engine.
3. **Pattern → dynamic TSX renderer** — Installs crafted templates; does not AI-generate layouts. Aligns with “personalize, don’t generate.”
4. **14 ported HTML templates + 100-entry bundle catalog** — Curated library exists; needs metadata enrichment, not replacement.
5. **Commerce core** — Checkout, orders, payments, delivery, wallet. Storefront is one capability; commerce ops already exist.
6. **AI quotas + soft budget degrade** — Cost-aware by design (`plan-limits.ts`).
7. **Three-app separation** — Natural home for Launch (admin onboarding routes) vs Workspace (admin `/workspace`) vs Platform (super-admin).

## 1.3 Architectural gaps (refactor toward)

1. **No GUMA Launch flow** — Template auto-assigned at signup via hash; merchant never sees Top 3 or explicitly chooses during launch.
2. **No Store DNA entity** — Vibe + category + brand kit fields scattered in `themeJson`; not a first-class profile used for scoring.
3. **No Template Package metadata** — Registry has `categoryHints` only; missing ideal product count, conversion focus, live-selling compat, performance score, etc.
4. **No draft/publish for storefront** — Shop Builder writes directly to `themeJson` (published state).
5. **No GUMA Workspace** — AI Studio, Agents, Shop Builder are separate surfaces; no execution plan, diff, or rollback UI.
6. **AI in wrong places** — Buyer chat + agent crons available on free tier (acceptable with quotas); no separation of “Launch = no LLM required” vs “Workspace = LLM.”
7. **No event bus** — Side effects inline in routes/webhooks; blocks audit replay and loose coupling.
8. **Domain boundaries implicit** — Packages exist but cross-import freely; no published domain APIs.
9. **Plan / product naming drift** — `free/growth/pro` vs constitution Free/Pro/Advance vs platform `starter` — confuses Launch vs Workspace gating.

## 1.4 Alignment score (approximate)

| Constitution pillar | Score | Notes |
|---------------------|------:|-------|
| AI serves, humans decide | 6/10 | content_queue approval exists; theme/checkout changes lack approval |
| Reduce friction | 7/10 | Signup is smooth; template choice deferred adds friction |
| Not a Shopify clone | 8/10 | Pattern library + AI agents differentiate |
| Launch lightweight / Workspace intelligent | 4/10 | No split product surfaces yet |
| Templates as packages | 5/10 | Good renderers; weak metadata/scoring |
| Rules before LLM | 8/10 | Brand kit excellent; agents default to LLM |
| Draft → Preview → Approve → Publish | 4/10 | Partial (products, content_queue only) |
| DDD + events + plugins | 3/10 | Monolith packages only |
| Cost-aware freemium | 7/10 | Quotas exist; Launch not explicitly zero-LLM |

**Overall:** Strong foundation (~65% constitutional alignment on principles, ~40% on target product structure). **Realignment, not rewrite.**

---

# Deliverable 2 — Constitutional Compliance Report

## ✅ Compliant (keep as-is or minor polish)

| Area | Evidence | Constitution clause |
|------|----------|---------------------|
| Deterministic signup branding | `packages/storefront-themes/src/brand-kit.ts` | Rules before LLM; Launch inexpensive |
| Template installation model | `tenant-storefront-home.tsx` dynamic renderers | Do not generate layouts with AI |
| Category → pattern matching | `patterns.ts` `matchStorePattern()` | Metadata + business rules |
| Multi-tenant slug routing | `apps/web/app/[tenantSlug]/` | Modular monolith |
| PayMongo + COD + Lalamove | `packages/services/` | Local commerce |
| AI usage quotas | `ai_usage_monthly`, `plan-limits.ts` | Cost strategy |
| Agent content approval path | `content_queue` statuses | Human control (marketing subset) |
| Product draft/active | `productStatusEnum` | Human control (catalog subset) |
| Platform audit log | `platform_audit_log` | Observability / audit |
| Pending tenant until activate | `tenants.status` | Merchant control before go-live |

## ⚠️ Partially compliant (redesign incrementally)

| Area | Issue | Required change |
|------|-------|-----------------|
| Onboarding | 2-step signup; template chosen by hash | Add Business Profile + Store DNA + Top 3 picker |
| Shop Builder | Full template grid; saves live | Move to Launch preview/publish; or post-launch “appearance” in Workspace with draft |
| AI Studio | Campaign preview; auto-publish “coming soon” | Fold into Workspace; gate by paid plan |
| Agents | Cron posts; LLM-first | Workspace automation; stronger approval UI |
| Template registry | Minimal metadata | Enrich to Template Package schema |
| Subscription gating | Template `minPlan` only | Separate Launch (free) vs Workspace features |
| Buyer shop assistant | LLM on storefront | Keep but quota-bound; not part of Launch setup |

## ❌ Non-compliant (conflicts — prioritize fix)

| Area | Conflict | Severity |
|------|----------|------------|
| **Direct theme save** | Shop Builder mutates `themeJson` without draft/approve | **High** |
| **No merchant template choice at launch** | Auto-assigned template violates “Merchant Selection” | **High** |
| **Split AI surfaces** | No unified Workspace; increases cognitive friction | **High** |
| **Handbook/stack docs say LangGraph/Prisma** | Docs conflict with Drizzle/custom AI — causes wrong refactors | **Medium** |
| **Plan catalog fragmentation** | 3–4 price/plan sources | **Medium** |
| **No domain event audit trail** | Tenant-visible change history missing | **Medium** |
| **100 templates marketed, ~14 live** | Product promise vs capability gap | **Medium** (product, not code) |
| **Suspended users not enforced** | Control/security gap | **Medium** |

## Constitutional verdict

The codebase **embodies the spirit** of the constitution (deterministic launch helpers, crafted templates, quotas) but **does not yet implement the product structure** (Launch vs Workspace, Store DNA, template scoring, publish workflow). Refactoring should **extend** `brand-kit`, `patterns`, and `storefront-themes` — not replace them.

---

# Deliverable 3 — Refactoring Roadmap

## Phase 0 — Governance & baseline (Week 1)

**Goal:** Single source of truth before structural moves.

- [ ] Adopt this document + constitution as `docs/CONSTITUTION.md`
- [ ] Unify plan catalog (`free` → Launch+, `growth` → Pro, `pro` → Advance) — one enum, one price table
- [ ] Reconcile Drizzle migrations with Neon
- [ ] Update README/handbook references: Drizzle not Prisma
- [ ] Add `ARCHITECTURE.md` domain map (Deliverable 6)

**Exit criteria:** Plans consistent; no doc-driven wrong migrations.

## Phase 1 — GUMA Launch (Weeks 2–5)

**Goal:** Constitutional launch flow without new LLM costs.

- [ ] Introduce **Store DNA** model (see §7 Migration)
- [ ] Build **Template Recommendation Engine** (scoring, Top 3 UI)
- [ ] Refactor signup/onboarding → Launch wizard:
  - Signup → Business Profile → Store DNA review → Top 3 → Select → Personalize (deterministic) → Preview → Publish
- [ ] Schema: `store_dna_json`, `theme_draft_json`, `theme_published_json`, `customization_version`
- [ ] **Publish** = copy draft → published + `tenants.status` eligible for activate
- [ ] Deprecate auto-template assignment as silent default; use as fallback only

**Exit criteria:** New merchant completes launch in <5 min without LLM; explicit template choice.

## Phase 2 — Domain events & boundaries (Weeks 4–6, parallel tail)

**Goal:** Loose coupling for publish, orders, AI completions.

- [ ] Implement `packages/events` (Inngest + Zod schemas)
- [ ] Emit: `Store.Published.V1`, `Order.PaymentSucceeded.V1`, `AI.PlanCompleted.V1`
- [ ] Extract domain index files — no cross-domain DB access from UI components
- [ ] Tenant-visible audit log (subset of platform audit)

**Exit criteria:** Store publish triggers revalidation + audit via event, not inline hack.

## Phase 3 — GUMA Workspace MVP (Weeks 6–10)

**Goal:** Paid-plan AI business operator shell.

- [ ] New route group: `apps/admin/app/workspace/` (or `/workspace`)
- [ ] Unified layout: NL input | execution plan | tool timeline | diff | approve/reject
- [ ] Migrate AI Studio campaign flows into Workspace modules
- [ ] Migrate Agents management into Workspace “Automations”
- [ ] LangGraph **only** for Workspace orchestration graph (optional Phase 3b)
- [ ] Gate Workspace behind `growth`/`pro` (Pro/Advance)

**Exit criteria:** Merchant can run one marketing task with visible plan + approval; no silent auto-publish.

## Phase 4 — Template Package system (Weeks 8–12, ongoing)

**Goal:** Templates as scored commerce products.

- [ ] Extend `template-registry.ts` → `TemplatePackage` metadata schema
- [ ] Scoring engine: DNA × metadata → ranked list (rules first; LLM tie-breaker optional on Pro+)
- [ ] Enrich bundle catalog entries with metadata for queued templates
- [ ] Continue porting priority queue (aircon, haircut, feane…)

**Exit criteria:** Recommendation engine uses metadata scores; AI optional.

## Phase 5 — Workspace depth (Weeks 12+)

- Inventory insights, pricing suggestions, SEO modules (each: suggest → diff → approve)
- Live selling, POS (Advance tier)
- Plugin registry (internal providers first)
- pgvector template memory (Pro+ only)

---

# Deliverable 4 — Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Big-bang Launch rewrite breaks signup | Medium | High | Feature flag `launch_v2`; parallel path; migrate new signups only |
| Shop Builder regression for existing tenants | High | Medium | Keep Shop Builder as “Appearance” with draft layer; backfill `theme_published_json` from current `themeJson` |
| LangGraph adoption delays Workspace | High | Medium | Ship Workspace UI with existing `packages/ai` first; swap orchestrator later |
| Plan rename breaks billing/webhooks | Medium | High | Phase 0 single catalog; alias old names in API for 1 release |
| Template scoring wrong → bad defaults | Medium | Medium | Always show Top 3 + preview; merchant must confirm |
| Inngest vendor lock-in | Low | Medium | Event schemas in `packages/events` vendor-neutral; thin adapter |
| Over-engineering plugins early | Medium | Medium | Constitution says plugin-first — implement **internal** provider registry only until 30+ templates |
| Git bloat from `reference/Free.Bundle.2023` | High | Low | `.gitignore` + CDN/archive storage |
| Team confusion (3 docs: constitution, handbook, handoff) | Medium | Medium | `docs/CONSTITUTION.md` supreme; handbook amends stack; handoff = state snapshot |
| Free tier LLM cost creep | Medium | High | Launch: zero LLM; hard block generation APIs until Workspace entitlement |

---

# Deliverable 5 — Proposed Folder Structure

**Principle:** Modular monolith — domains in `packages/`, experiences in `apps/`. No microservices until scale proves need.

```
guma-commerce/
├── apps/
│   ├── web/                          # Buyer storefront + marketing
│   │   └── app/
│   │       ├── [tenantSlug]/         # Published storefront only
│   │       └── api/
│   ├── admin/
│   │   └── app/
│   │       ├── launch/               # NEW — GUMA Launch wizard (freemium)
│   │       │   ├── profile/
│   │       │   ├── dna/
│   │       │   ├── templates/        # Top 3 selection
│   │       │   ├── personalize/
│   │       │   ├── preview/
│   │       │   └── publish/
│   │       ├── workspace/            # NEW — GUMA Workspace (paid)
│   │       │   ├── page.tsx          # Shell
│   │       │   ├── marketing/
│   │       │   ├── catalog/
│   │       │   ├── automations/
│   │       │   └── settings/
│   │       ├── shop-builder/         # LEGACY → redirect to launch or workspace
│   │       ├── onboarding/         # Slim → redirect into /launch
│   │       ├── ai-studio/            # LEGACY → workspace/marketing
│   │       └── agents/               # LEGACY → workspace/automations
│   └── platform/                     # Super-admin (unchanged)
│
├── packages/
│   ├── domain/                       # NEW — optional aggregate re-exports
│   │   ├── identity/
│   │   ├── tenancy/
│   │   ├── storefront/
│   │   ├── templates/                # Package metadata + scoring
│   │   ├── commerce/
│   │   ├── ai/
│   │   └── workspace/                # Workspace session, plans, approvals
│   ├── db/                           # Drizzle schema (unchanged location)
│   ├── events/                       # Inngest client, schemas, handlers
│   ├── auth/
│   ├── ai/                           # LLM router (Workspace-only tasks)
│   ├── services/                     # PayMongo, Lalamove, SMS
│   ├── storefront-themes/            # patterns, brand-kit, registry
│   └── ui/
│
├── docs/
│   ├── CONSTITUTION.md               # This constitution (product law)
│   ├── ARCHITECTURE.md               # Domain map + event catalog
│   └── COMPREHENSIVE-HANDOFF-*.md
│
└── reference/                        # HTML sources (gitignore large bundles)
```

**Migration note:** Prefer **`packages/storefront-themes`** expansion over new `packages/domain/templates` until boundaries stabilize — avoid duplicate template logic.

---

# Deliverable 6 — Domain Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GUMA ai-Commerce Monolith                        │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│   Identity   │   Tenancy    │  Storefront  │  Templates   │  Commerce   │
│  auth pkg    │  db.tenants  │  apps/web    │  storefront- │  products   │
│  sessions    │  plans       │  renderers   │  themes      │  orders     │
├──────────────┴──────────────┴──────────────┴──────────────┴─────────────┤
│  Payments          Shipping         Billing           Notifications      │
│  services/paymongo services/lalamove db/plan-billing services/sms       │
├──────────────────────────────────────────────────────────────────────────┤
│  AI (Workspace)    Launch (deterministic)    Analytics    Media          │
│  packages/ai       brand-kit, scoring        platform KPI  media pkg     │
├──────────────────────────────────────────────────────────────────────────┤
│  Events (Inngest)  │  Plugins (internal registry → future marketplace)   │
│  packages/events   │  services/* providers                               │
└──────────────────────────────────────────────────────────────────────────┘

Experience layer mapping:
  GUMA Launch  → apps/admin/app/launch/*  + packages/storefront-themes (DNA, scoring)
  GUMA Workspace → apps/admin/app/workspace/* + packages/ai + packages/events
  Buyer shop   → apps/web (reads published theme only)
  Platform ops → apps/platform
```

### Domain ownership rules

| Domain | Owns tables / state | Public API surface | Emits events |
|--------|---------------------|-------------------|--------------|
| Identity | users, sessions | `@guma-commerce/auth` | User.Registered |
| Tenancy | tenants, store_dna | `tenancy.service` | Tenant.Created, Merchant.Upgraded |
| Templates | registry metadata | `recommendTemplates(dna)` | Template.Installed |
| Storefront | renderers (code) | pattern dispatch | — |
| Commerce | products, orders | db queries | Product.*, Order.* |
| Payments | payments | services/paymongo | Payment.Succeeded |
| Shipping | shipments | services/lalamove | Shipment.Booked |
| AI | ai_usage, agent_runs | `ai.generate*` (Workspace gated) | AI.PlanCompleted |
| Launch | draft themes | `launch.publish()` | Store.Published |
| Workspace | sessions, approvals | `workspace.runTask()` | AI.* |
| Billing | subscriptions | plan-billing queries | Merchant.Upgraded |

**Rule:** UI components import domain **services**, not raw `db` client (except server actions in app layer).

---

# Deliverable 7 — Migration Plan

## 7.1 Store DNA schema (new)

```typescript
// Stored on tenants.store_dna_json (new column) or composed from existing fields during migration
interface StoreDNA {
  version: 1;
  businessName: string;
  category: ShopBusinessCategory;
  vibe: ShopVibeId;
  audience?: string;           // optional merchant input
  productCountHint?: "none" | "1-10" | "11-50" | "50+";
  sellingChannels?: ("social" | "marketplace" | "in_person")[];
  goals?: ("launch_fast" | "brand_look" | "conversion" | "live_selling")[];
  locale: "en" | "fil" | "taglish";
  derivedAt: string;           // ISO
}
```

**Migration:** Backfill from existing `tenants.category`, `themeJson.vibe`, `themeJson.templateId` for live shops.

## 7.2 Template Package metadata (extend registry)

```typescript
interface TemplatePackageMetadata {
  id: ShopTemplateId;
  industryFit: ShopBusinessCategory[];
  idealProductCount: { min: number; max: number };
  targetAudience: string[];
  visualStyle: ShopVibeId[];
  conversionFocus: "catalog" | "menu" | "booking" | "editorial";
  mobileScore: number;       // 1-100
  liveSellingReady: boolean;
  seoReady: boolean;
  performanceScore: number;
  accessibilityScore: number;
  supportedFeatures: ("cart" | "categories" | "cod" | "variants" | "booking")[];
  minPlan: "free" | "growth" | "pro";
}
```

**Scoring (deterministic):**

```
score(template, dna) =
  w1 * categoryMatch +
  w2 * vibeMatch +
  w3 * productCountFit +
  w4 * goalMatch +
  w5 * planEligible
→ return top 3
```

Optional: LLM tie-breaker when top 3 scores within ε — **Pro/Workspace only**.

## 7.3 Launch flow migration

| Step | Current | Target |
|------|---------|--------|
| 1 | signup-wizard step 1–2 | `/launch/profile` (same fields + DNA hints) |
| 2 | `deriveBrandKit()` silent | `/launch/dna` — show inferred DNA; merchant confirms |
| 3 | — | `/launch/templates` — Top 3 cards with scores |
| 4 | — | merchant picks → `/launch/personalize` (palette, tagline from brand-kit, editable) |
| 5 | — | `/launch/preview` — iframe storefront draft |
| 6 | onboarding + shop-builder | `/launch/publish` → event `Store.Published.V1` |
| 7 | activate shop | unchanged — requires product + publish |

**Existing merchants:** Skip Launch; one-time banner “Review your Store DNA” optional.

## 7.4 Draft / publish migration

```sql
-- Conceptual (Drizzle migration)
ALTER TABLE tenants ADD COLUMN theme_draft_json jsonb;
ALTER TABLE tenants ADD COLUMN theme_published_json jsonb;
ALTER TABLE tenants ADD COLUMN customization_version integer DEFAULT 1;
ALTER TABLE tenants ADD COLUMN store_dna_json jsonb;

-- Backfill
UPDATE tenants SET theme_published_json = theme_json WHERE theme_published_json IS NULL;
```

Shop Builder saves → `theme_draft_json`. Publish → copy to `theme_published_json` + bump version + snapshot for rollback.

Storefront reads **`theme_published_json` only** (fallback `theme_json` during migration).

## 7.5 Workspace migration

1. Create `/workspace` shell with conversation + plan panel (empty state)
2. Port AI Studio campaign → `/workspace/marketing`
3. Port Agents → `/workspace/automations`
4. Add approval drawer component shared by theme + catalog + content tasks
5. Redirect old routes with 302 + deprecation notice

## 7.6 What NOT to migrate

| Do not | Reason |
|--------|--------|
| Rewrite Drizzle → Prisma | Constitution allows modern stack; working DB |
| Replace TSX renderers with AI layout gen | Violates template philosophy |
| Merge web + admin apps | Breaks deployment boundaries |
| LangGraph in Launch | Violates cost + AI philosophy |
| Block shipping on 100 template ports | Launch uses Top 3 from available library; expand catalog in parallel |

---

# Implementation approval gate

**Do not start Phase 1+ code until product owner confirms:**

1. Plan naming: `free/growth/pro` ↔ Free/Pro/Advance mapping  
2. Launch replaces signup step 2 template logic (yes/no)  
3. Shop Builder fate: redirect to Launch vs keep as Appearance editor  
4. Workspace route prefix: `/workspace` vs `/ai-workspace`  
5. Inngest as event vendor (vs Trigger.dev)

---

# Summary recommendation

GUMA ai-Commerce constitutional refactoring is **feasible as incremental realignment**. The repo already contains the most important constitutional asset — **deterministic, zero-LLM brand personalization** — and a **crafted template library**. The work is primarily:

1. **Product structure** — split Launch vs Workspace experiences  
2. **Merchant control** — draft/publish + explicit template choice  
3. **Template intelligence** — metadata + scoring, not more AI  
4. **Platform plumbing** — events, domain boundaries, audit  

**Estimated effort:** Phase 0–1 ≈ 4–5 weeks for constitutional Launch; Phase 3 Workspace MVP ≈ 4–6 weeks additional.

**First code change after approval:** Phase 0 plan unification + Store DNA schema + TemplatePackage metadata types (no UI yet).

---

*Prepared for GUMA ai-Commerce constitutional refactoring. No application code was modified in this assessment.*
