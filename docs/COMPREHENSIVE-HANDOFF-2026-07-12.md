# Guma Commerce — Comprehensive Summary & Handoff

**Last updated:** 2026-08-06 (delivery orchestrator live in apps + helpdesk tickets; Frontend1 CTA polish; Chat MVP Beta; manual e-wallet)  
**Audience:** Next developer, architect, or AI agent continuing this repo  
**Chief Engineer review:** Prefer [`CHIEF-ENGINEER-REVIEW-SUMMARY.md`](./CHIEF-ENGINEER-REVIEW-SUMMARY.md) for launch/architecture sign-off.  
**Supersedes partially:** `docs/AGENT-HANDOFF.md` — read both; this doc is the current whole-repo picture including template library work, Handbook v1.2 assessment, **Sprints 1–5**, and **2026-08 ops deltas** (delivery, helpdesk, chat, payments). **Product next:** `docs/PRIORITY-SCOPE-BRAND-GUARD.md` after soft-launch hygiene.

---

## 1. Executive summary

**Guma Commerce** is a multi-tenant, AI-assisted social commerce platform for Philippine sellers. Merchants get a branded mobile storefront at `/{shop-slug}`, manage products/orders in a seller admin, and optionally use AI for content, campaigns, and buyer chat.

| Dimension | Status |
|-----------|--------|
| **Maturity** | Soft-launchable MVP+ — checkout (incl. manual e-wallet), orders, owner-led chat, multi-courier delivery wiring, ticketed helpdesk, **18** themes, platform super-admin, crown-jewel CR rails |
| **Stack** | pnpm + Turbo monorepo, Next.js 15, React 19, Drizzle + Neon Postgres |
| **Templates** | **18** HTML-ported themes live + built-in token themes; Free Bundle 2023 catalogued; Sprint 5 priority ports **aircon / carserv / motto / studio** integrated |
| **Plans (ADR D4)** | Single catalog `@guma-commerce/plans` — IDs `free`/`growth`/`pro`; labels **Free / Pro / Advance**; ₱0 / ₱499 / ₱999 |
| **Delivery** | Orchestrator in checkout/book path — Lalamove + GrabExpress (+ failover) + manual Assign rider; webhooks for Lalamove/Grab |
| **Helpdesk** | Ticket domain (`support_tickets`) — web contact, seller admin, platform `/helpdesk` with SLA clocks |
| **Handbook** | v1.2 hybrid adoption — crown jewel + plan catalog landed; Workstation unification and infra still incremental |
| **Deployment** | Vercel-ready docs; production deploy not assumed complete |

**Repo path:** `D:\All Apps\gumacommerce`  
**npm scope:** `@guma-commerce/*`

---

## 2. Product vision & handbook alignment

### 2.1 What we're building toward (Handbook v1.2)

- **100% AI-prompt-driven** shop customization with visible reasoning (AI Workstation)
- **100+ templates** — merchants pick a vertical, AI personalizes logo, copy, colors, products
- **Freemium → Pro → Advance** with local PH checkout (GCash, Maya, COD)
- **Event-driven** side effects (Inngest), DDD bounded contexts, AI permission scopes, draft → approve → publish

### 2.2 What exists today

| Handbook concept | Current implementation |
|------------------|------------------------|
| AI Workstation | Split: **Shop Builder** + **Workspace** (marketing/SEO/checkout/shipping/approvals) + **Agents** — Approvals diff UI live; full unified Workstation still converging |
| 100+ templates | **18** full React ports + built-in token themes; **100** in Free Bundle catalog; priority queue ported |
| Template in onboarding | Signup picks category/vibe; Launch recommends Top 3; template also chosen in Shop Builder |
| LangGraph orchestration | Custom `packages/ai` + cron agents — **no LangGraph** |
| Event bus (Inngest) | `packages/events` thin bus — Theme/Catalog/Pricing/SEO/Checkout/Shipping/Order events emitting |
| Prisma + RLS | **Drizzle**, app-level `tenantId` scoping |
| Plans FREE/PRO/ADVANCE | **Canonical:** IDs `free`/`growth`/`pro`; labels Free/Pro/Advance via `@guma-commerce/plans` (ADR D4 done) |
| Live selling, POS, smart pricing | **Not built** (pricing *suggest* CR domain exists) |
| Commerce + logistics | **Largely built** (checkout CR + tax/coupons, shipping CR, PayMongo/manual e-wallet, Lalamove+Grab orchestrator, manual riders, wallet, helpdesk) |

### 2.3 Agreed hybrid direction (do not rewrite from handbook verbatim)

1. **Keep** Drizzle, 3-app monolith, PayMongo-first, pattern-based TSX renderers  
2. **Add** Inngest events (partially landed), unified Workstation, theme draft/publish (landed), LangGraph for customization only (deferred)  
3. **Defer** Prisma migration, plugin marketplace, ClickHouse, full pgvector memory  
4. **Map plans:** Handbook FREE → `free`, PRO → `growth`, ADVANCE → `pro` — **implemented** in `@guma-commerce/plans`

Full assessment: `docs/HANDBOOK-V1.2-ASSESSMENT.md`. Binding decisions: `docs/ADR-0001-handbook-adoption.md`.

---

## 3. Repository structure

```
guma-commerce/
├── apps/
│   ├── web/                 # Storefront + marketing (buyer-facing) :3010
│   ├── admin/               # Seller dashboard + Launch + Workspace :3001
│   └── platform/            # Super-admin console (all tenants) :3002
├── packages/
│   ├── db/                  # Drizzle schema, migrations, queries
│   ├── ai/                  # LLM router, permissions; plan-limits re-exports @guma-commerce/plans
│   ├── plans/               # Canonical plan catalog + AI limits (ADR D4)
│   ├── auth/                # JWT sessions, signup, Google OAuth
│   ├── events/              # Inngest client + Domain.Event.Vn emitters
│   ├── services/            # PayMongo, delivery orchestrator (Lalamove/Grab/manual), SMS, rate-limit, push
│   ├── storefront-themes/   # Templates, patterns, registry, bundle catalog
│   ├── ui/                  # Shared Button/Card/Badge
│   └── media/               # Image-enhance prompt templates (minimal)
├── reference/               # Extracted HTML template sources (incl. aircon/carserv/motto/studio)
├── packages/storefront-templates/   # Human docs (README, BUNDLE catalog)
└── docs/
    ├── CHIEF-ENGINEER-REVIEW-SUMMARY.md   # ← final review / launch sign-off
    ├── AGENT-HANDOFF.md
    ├── COMPREHENSIVE-HANDOFF-2026-07-12.md   # ← this file
    ├── DELIVERY-AND-HELPDESK.md
    ├── MVP-MANUAL-EWALLET-CHAT.md
    ├── MVP-HARDENING-P1-INTEGRATION-MOCKS.md
    ├── HANDBOOK-V1.2-ASSESSMENT.md
    ├── ADR-0001-handbook-adoption.md
    ├── CROWN-JEWEL-AI-APPROVAL.md
    ├── ARCHITECTURE.md
    ├── SPRINT-1-SEO-PROGRESS.md … SPRINT-5-TEMPLATE-PORTS-PROGRESS.md
    ├── PRIORITY-SCOPE-BRAND-GUARD.md
    ├── DATABASE.md
    └── DEPLOY-VERCEL.md
```

**Tooling:** pnpm 9, Turbo 2, Node ≥20, TypeScript 5.7

---

## 4. Applications & ports

| App | Package | Dev port | Role |
|-----|---------|----------|------|
| **Storefront + marketing** | `@guma-commerce/web` | **3010** (`package.json`; README still says 3000) | `/{tenantSlug}`, checkout, buyer chat, webhooks |
| **Seller admin** | `@guma-commerce/admin` | **3001** | Dashboard, products, orders, Shop Builder, Agents, AI Studio, settings |
| **Platform console** | `@guma-commerce/platform` | **3002** | Super-admin: tenants, users, plans, helpdesk, moderation, frontends, audit |

### Dev commands

```powershell
cd D:\All Apps\gumacommerce
pnpm install

# All apps (Turbo)
pnpm dev

# Single app — clean .next cache if HMR/webpack issues
cd apps/web && pnpm run dev:clean      # → http://localhost:3010
cd apps/admin && pnpm run dev:clean    # → http://localhost:3001
cd apps/platform && pnpm exec next dev # → http://localhost:3002
```

### Auth

- Shared cookie: `gumacommerce_session`
- Package: `packages/auth` (JWT via `jose`)
- **Platform login (seeded):** `admin@guma.ph` / `GumaAdmin2026!` — change before shared use
- Roles: `super_admin`, `seller_owner`, `seller_staff`, `customer`

---

## 5. Architecture (runtime)

```
Buyer / Seller / Super-admin
        ↓
   apps/web | apps/admin | apps/platform  (Next.js 15 App Router)
        ↓
   packages/*  (db, ai, auth, services, storefront-themes)
        ↓
   Neon Postgres  |  optional Upstash Redis  |  PayMongo / Lalamove / Grab / Semaphore
```

### Request flow — storefront

1. `apps/web/app/[tenantSlug]/page.tsx` resolves tenant via `getStorefrontTenant(slug)`
2. Demo slugs → `apps/web/lib/demo-data.ts`; live slugs → `packages/db` queries
3. `TenantStorefrontHome` resolves pattern → **dynamic import** of renderer
4. Client cart: `apps/web/lib/cart.ts` → `localStorage` key `guma-cart:{slug}`

### Request flow — seller

1. Signup → `registerSeller()` → tenant `status: pending`
2. Onboarding checklist → add product → `POST /api/shop/activate`
3. Shop design → `/shop-builder` → saves `tenants.themeJson`

---

## 6. Database & multi-tenancy

- **ORM:** Drizzle (`packages/db`)
- **Production:** Neon Postgres (Singapore)
- **Local:** Docker Postgres port **5434** (`docker compose`)
- **Tenancy:** `tenants.slug` is the public URL key; child tables use `tenantId`

### Core tables (non-exhaustive)

| Table | Purpose |
|-------|---------|
| `tenants` | Shop config: `themeJson`, `settingsJson`, `subscriptionPlan`, `status` |
| `users` | Sellers/customers; `tenantId` for sellers |
| `products` | Catalog (`draft` / `active` / `archived`) |
| `orders`, `order_items`, `payments` | Commerce lifecycle |
| `content_queue` | Agent-generated posts (`draft` → `approved` → `posted`) |
| `agent_runs`, `ai_usage_monthly` | AI quotas & logging |
| `shop_chat_messages` | Buyer↔seller shop chat history |
| `support_tickets`, `support_ticket_messages` | Platform helpdesk (SLA clocks) |
| `delivery_quotes`, `deliveries` | Courier quotes/bookings (lalamove/grab/manual) |
| `tenant_wallets`, `wallet_ledger_entries`, `tenant_payouts` | Seller wallet |
| `platform_audit_log` | Super-admin audit trail |
| `platform_settings` | e.g. `active_landing` → frontend1 \| frontend2 |

### Pitfalls

- **Never run `db:push`** against live Neon if handoff SQL was applied manually — use `db:generate` + migrate or targeted SQL
- **Never import `@guma-commerce/db` from `"use client"`** — pulls Postgres driver, breaks browser bundle
- **Schema drift:** platform tables may exist in Neon before matching drizzle migration files — run `pnpm db:reconcile`

---

## 7. Template & storefront system

Three layers in `packages/storefront-themes/`:

| Layer | File | Purpose |
|-------|------|---------|
| **Shop templates** | `src/templates.ts` | Design tokens, tiers (`basic`/`standard`/`advanced`), `minPlan` gates |
| **Store patterns** | `src/patterns.ts` | Links `templateId` → `storefrontRenderer` + category auto-match |
| **External registry** | `src/template-registry.ts` | Metadata for ported HTML themes |
| **Bundle catalog** | `src/bundle-catalog.ts` | All 100 Free Bundle 2023 entries |
| **Shop categories** | `src/shop-categories.ts` | 39 verticals for onboarding matching |

### Dispatch

- **File:** `apps/web/components/storefront/tenant-storefront-home.tsx`
- Uses **`next/dynamic`** per renderer (reduces webpack HMR corruption)
- Fallback: `themed-home.tsx` (“Classic Guma” token theme)

### Live HTML-ported renderers (13 + simply-sweet)

| ID | Demo URL | Category | Renderer path |
|----|----------|----------|---------------|
| `bloom` | `/bloom-demo` | Fashion | `storefront/bloom/` |
| `sarab` | `/sarab-demo` | Food & Beverage | `storefront/sarab/` |
| `furnish` | `/furnish-demo` | Furniture | `storefront/furnish/` |
| `zay` | `/zay-demo` | General retail | `storefront/zay/` |
| `electro` | `/electro-demo` | Electronics | `storefront/electro/` |
| `kaira` | `/kaira-demo` | Fashion | `storefront/kaira/` |
| `foodmart` | `/foodmart-demo` | Grocery | `storefront/foodmart/` |
| `stylish` | `/stylish-demo` | Footwear | `storefront/stylish/` |
| `mellow` | `/mellow-demo` | Hotels | `storefront/mellow/` |
| `organic` | `/organic-demo` | Farm produce | `storefront/organic/` |
| `waggy` | `/waggy-demo` | Pet supplies | `storefront/waggy/` |
| `fruitables` | `/fruitables-demo` | Produce | `storefront/fruitables/` |
| `ministore` | `/ministore-demo` | Gadgets | `storefront/ministore/` |
| `simply-sweet` | (DB seed) | Catering | `storefront/sweet-kitchen/` |

Also: `/demo` (Neon Bazaar default), `/model` (flagship model store).

### Built-in token themes (no separate HTML port)

Examples in `templates.ts`: `clean-guma`, `neon-bazaar`, `simply-sweet`, `glass-future`, `holo-grid`, etc. — rendered via `themed-home` or experience pattern.

### Template integration playbook (per new zip)

1. Extract to `reference/{name}/`
2. Build React renderer under `apps/web/components/storefront/{name}/`
3. Register in `packages/storefront-themes/src/{templates,patterns,template-registry}.ts`
4. Extend `patternId` union in `packages/db/src/schema/index.ts` if needed
5. Add branch in `tenant-storefront-home.tsx` (prefer dynamic import)
6. Add demo tenant in `apps/web/lib/demo-data.ts`
7. Document in `packages/storefront-templates/README.md`
8. Verify: `pnpm --dir apps/web run dev:clean` → `/{name}-demo` returns 200

### Free Bundle 2023 (100 templates)

| Status | Count |
|--------|------:|
| Live HTML→React ports (this repo) | **18** |
| Free Bundle catalog `integrated` | 4 (aircon, carserv, motto, studio) |
| Variant of integrated | 11 |
| Queued storefront | ~52 |
| Service landing / admin / content / non-storefront | remainder of 100 |

**Docs:** `packages/storefront-templates/BUNDLE-2023-CATALOG.md`, `docs/SPRINT-5-TEMPLATE-PORTS-PROGRESS.md`  
**Priority queue:** `listPriorityPortQueue()` — **aircon → carserv → motto → studio** (all `integrated`, Sprint 5)

**Not all 100 are integrated** — only catalogued and categorized; expand ports as demand warrants.

---

## 8. Seller journeys

### Signup & onboarding

| Step | Location |
|------|----------|
| Account + shop name/slug/category/vibe | `apps/admin/components/signup-wizard.tsx` |
| API | `apps/admin/app/api/auth/signup/route.ts` → `packages/auth` |
| Google OAuth | `/signup/shop` if `needsShopSetup` |
| Checklist | `/onboarding` — verify email, add product, activate |
| Go live | `POST /api/shop/activate` (requires products) |
| Pending shop UX | Storefront “Coming soon” until `tenants.status = active` |

**Gap vs handbook:** Template selection happens in **Shop Builder**, not signup.

### Shop Builder

- **UI:** `apps/admin/app/shop-builder/page.tsx`, `components/shop-builder.tsx`
- Saves `themeJson` (templateId, colors, tagline, promo copy)
- Plan-gated templates via `canUseTemplate()` / `minPlan`

---

## 9. Commerce features

| Feature | Status | Key paths |
|---------|--------|-----------|
| Product CRUD | ✅ | `apps/admin/app/products/`, `api/products/*` |
| Categories | ✅ | `apps/admin/app/categories/` |
| Cart (buyer) | ✅ | `apps/web/lib/cart.ts` (optimistic localStorage) |
| Checkout | ✅ | `apps/web/app/api/checkout/route.ts` |
| Manual e-wallet | ✅ MVP | Proof upload + seller confirm-payment; `PAYMENTS_MODE=manual_ewallet` |
| PayMongo | ✅ (+ mock gate) | `packages/services/src/payments/paymongo.ts` |
| COD | ✅ | Checkout path |
| Orders admin | ✅ | Book courier + Assign rider |
| Multi-courier delivery | ✅ (+ mock gate) | Orchestrator; Lalamove/Grab/manual; webhooks `/api/webhooks/{lalamove,grab}` |
| Buyer↔seller chat | ✅ MVP Beta | Storefront widget + admin `/messages`; WhatsApp overflow |
| Platform helpdesk | ✅ | `support_tickets`; web `/contact`, admin support, platform `/helpdesk` |
| Wallet & payouts | ✅ schema + APIs | `api/wallet/*`, KYC flow |
| SMS (Semaphore) | ✅ | Pro+ (`growth`+) agent reminders |
| Push notifications | ✅ | VAPID web push on order events |
| SEO (Workspace) | ✅ | `seo_*_json` CR → Approvals → storefront metadata/robots/sitemap |
| Checkout config | ✅ | `checkout_*_json` CR; tax/coupons; Order.Created/Succeeded |
| Shipping profiles | ✅ | `shipping_*_json` CR; zones/rates; mirrors `settings_json.delivery` |
| Marketing landings | ✅ | `frontend1` / `frontend2` via `active_landing`; preview `/frontend1`, `/guma-one-ai` |

---

## 10. AI & agents

**Not LangGraph** — custom implementation:

| Component | Path |
|-----------|------|
| LLM router | `packages/ai/src/providers/llm.ts` (OpenAI, Gemini, Groq, mock) |
| Quotas | `@guma-commerce/plans` (+ thin re-export `packages/ai/src/plan-limits.ts`) + `ai_usage_monthly` |
| Generators | `packages/ai/src/generator.ts` |
| Permissions / SCOPE_MATRIX | `packages/ai/src/permissions.ts` |
| Agent runner | `apps/admin/lib/agents/run-agents.ts` |
| Agent UI | Workspace / Agents |
| Marketing / AI Studio | `/workspace/marketing` (legacy `/ai-studio` redirects) |
| Buyer chat | `apps/web/app/api/chat/route.ts` + `shop-assistant.tsx` |
| Crons | `apps/admin/vercel.json` |

### AI limits by plan (seller billing)

Canonical source: `@guma-commerce/plans` (`PLAN_AI_LIMITS`).

| Plan ID | Label | Chat/day | Generations/mo | Agent runs/week |
|---------|-------|----------|----------------|-----------------|
| `free` | Free | 25 | 5 | 3 |
| `growth` | Pro | 200 | 100 | 14 |
| `pro` | Advance | 2000 | 500 | 999 |

Aliases: `starter`→`growth`, `advance`→`pro`, `sulit`→`free`. Soft token budget degrades model to Gemini Flash when exceeded.

---

## 11. Platform super-admin (`apps/platform`)

Built 2026-07-05; extended 2026-08. Surfaces:

- Dashboard (MRR, GMV, charts)
- Tenants (suspend/activate/plan change)
- Users, Subscriptions, Moderation (`content_queue`)
- **Helpdesk** (ticket queue, SLA, assign/reply/internal notes)
- **Frontends** (`active_landing` → frontend1 GumaCommerce / frontend2 Guma One.ai)
- Orders (platform-wide), Audit log

**Plan catalog:** Uses `@guma-commerce/plans` via `CLIENT_PLANS` / `PLATFORM_PLANS` re-exports (ADR D4). Legacy DB rows with `starter` normalize to `growth` at read time. Filters show Free / Pro / Advance (+ legacy starter).

**Login (seeded):** `admin@guma.ph` / `GumaAdmin2026!` — change before shared/prod use.

---

## 12. Subscription & billing

| Source | Plans | Notes |
|--------|-------|-------|
| **Canonical** | `@guma-commerce/plans` | IDs `free`/`growth`/`pro`; labels Free/Pro/Advance; ₱0 / ₱499 / ₱999 |
| Seller admin / web / platform | same | Thin wrappers / re-exports |
| AI limits | same package | `PLAN_AI_LIMITS` |
| Handbook v1.2 | FREE, PRO, ADVANCE | Mapped → free / growth / pro |
| PayMongo upgrade | `growth` \| `pro` | Contract unchanged |

Upgrade flow: `apps/admin/app/api/billing/upgrade/route.ts` → PayMongo → webhook applies plan.

---

## 13. Environment variables

See `.env.example`. Critical groups:

| Group | Variables |
|-------|-----------|
| Database | `DATABASE_URL`, `DATABASE_URL_POOLED` |
| Auth | `AUTH_SECRET`, `CRON_SECRET`, Google OAuth |
| URLs | `NEXT_PUBLIC_STOREFRONT_URL`, `NEXT_PUBLIC_ADMIN_URL` (use **3010** for web locally) |
| AI | `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` |
| Payments | `PAYMONGO_*`, `PAYMONGO_WEBHOOK_SECRET` |
| Delivery | `LALAMOVE_*` |
| SMS | `SEMAPHORE_API_KEY` |
| Optional | Upstash Redis, Vercel Blob, VAPID push, Sentry |

Features **degrade gracefully** without keys (mocks for PayMongo/Lalamove/LLM).

---

## 14. Recent work

### 2026-07-13 — MVP completion sprints 1–5

| Sprint | Outcome | Doc |
|--------|---------|-----|
| 1 SEO | Tenant SEO draft/publish JSON; Workspace SEO; storefront metadata/robots/sitemap/JSON-LD | `SPRINT-1-SEO-PROGRESS.md` |
| 2 Checkout | Checkout draft/publish; tax/coupons; sessions; abandon sweep; Order events | `SPRINT-2-CHECKOUT-PROGRESS.md` |
| 3 Shipping | Shipping profiles/zones/rates; CR publish; delivery mirror | `SPRINT-3-SHIPPING-PROGRESS.md` |
| 4 Plan catalog | `@guma-commerce/plans`; Free/Pro/Advance labels; aliases; ADR D4 | `SPRINT-4-PLAN-CATALOG-PROGRESS.md` |
| 5 Template ports | aircon, carserv, motto, studio React ports + demos | `SPRINT-5-TEMPLATE-PORTS-PROGRESS.md` |

### 2026-07-06 — 2026-07-12 (pre-sprint)

- Ported: **waggy**, **fruitables**, **ministore**
- Catalogued **Free Bundle 2023** (100 templates)
- Expanded shop categories **19 → 39**
- Crown jewel Phase 1–3: change_requests, Approvals, theme publish

### Architecture decisions (from handbook review)

- Do **not** migrate to Prisma
- Adopt **Inngest + Workstation + draft/publish** incrementally (CR rails + events largely landed for Phase 4 domains)
- Keep **pattern + TSX renderer** model for templates
- **One plan catalog** — `@guma-commerce/plans` (ADR D4)

---

## 15. Known issues & tech debt

| Issue | Severity | Notes |
|-------|----------|-------|
| ~~Plan price sources disagree~~ | ~~High~~ | **Resolved Sprint 4** — `@guma-commerce/plans` |
| Large uncommitted working tree (2026-08) | High | Commit/PR in slices before production |
| Marketing overclaims vs shipped logistics/payments | High | Prefer frontend1 live; honest FAQ copy |
| Drizzle migrations lag / journal quirks | Medium | Prefer migrate/reconcile; never `db:push` |
| Suspended tenant/user not enforced on seller login/storefront | Medium | Platform can suspend; apps don't hard-block yet |
| Helpdesk has no email/push notify yet | Medium | Agents poll `/helpdesk` |
| Email verification placeholder | Medium | Token exists; Resend not wired |
| Unified AI Workstation UX | Medium | Approvals exist; Shop Builder / Marketing / Agents still separate entry points |
| Live selling, POS | — | Handbook future / Advance |
| LangGraph / ClickHouse / Meili / Vault | — | Deferred (ADR D6) |
| Remaining Free Bundle ports | Low | Demand-driven; priority queue done |

### Webpack dev error (`__webpack_modules__[moduleId] is not a function`)

Usually stale `.next` cache during HMR. Fix:

```powershell
cd apps/web && pnpm run dev:clean
```

---

## 16. Recommended roadmap (post-sprint)

### Landed 2026-08-05 → 2026-08-06 (ops / MVP)

- [x] Manual e-wallet + seller confirm payment
- [x] Chat MVP Beta (owner-led messages + AI FAQ + WhatsApp overflow)
- [x] Delivery orchestrator wired into quote/checkout/book + Grab webhook + Assign rider
- [x] Helpdesk tickets (migration `0013`) + platform/admin/web surfaces
- [x] Frontend1 CTA reliability pass (mobile nav, contact→ticket, `:3010` defaults)

Detail: `DELIVERY-AND-HELPDESK.md`, `MVP-MANUAL-EWALLET-CHAT.md`, `CHIEF-ENGINEER-REVIEW-SUMMARY.md`.

### Immediate soft-launch hygiene

- [ ] Commit/PR slices; Vercel + secrets cutover
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_SHOP=true` (or real demo tenant) in prod
- [ ] Staff platform Helpdesk; set Lalamove/Grab keys when partner-ready
- [ ] Enforce suspended tenant/user on login + storefront
- [ ] Update README ports if still stale (web = **3010**)

### Next product priority (after launch hygiene)

**Brand Guard (anti-AI-slop)** — binding scope: [`PRIORITY-SCOPE-BRAND-GUARD.md`](./PRIORITY-SCOPE-BRAND-GUARD.md).

- Harvest [killaislop.com](https://killaislop.com) / yetone taxonomy; do **not** run the coding agent per merchant.
- Slice A: template CI scan · Slice B: Free Launch prevention · Slice C: Growth+ Polish via `change_requests`.

### Done (do not re-open unless regressing)

- [x] Unify plan catalog (`@guma-commerce/plans`, ADR D4)
- [x] Theme draft/publish + change_requests + Approvals (crown jewel Phases 1–3)
- [x] Phase 4 domains: catalog, pricing, SEO, checkout, shipping
- [x] Priority template ports: aircon → carserv → motto → studio
- [x] `packages/events` thin emitters for landed domains

### Still open

#### Phase A — Foundation leftovers

- [ ] Generate/reconcile Drizzle migrations vs Neon
- [ ] Enforce suspended tenant/user on login + storefront
- [ ] Update README ports if still stale (web = **3010**)

#### Phase A2 — Brand Guard (next product priority)

- [ ] Slice A: CI / `pnpm` scan on `apps/web/components/storefront/**`
- [ ] Slice B: Launch + brand-kit deterministic anti-slop validators (zero LLM)
- [ ] Slice C: Growth+ Brand Guard Polish → change_requests + Approvals

#### Phase B — AI Workstation convergence

- [ ] Unify Shop Builder + Workspace modules into one preview/diff surface
- [ ] Template pick firmly in Launch onboarding (Top 3 already scored)
- [ ] LangGraph **only** if customization graph needs it (optional)

#### Phase C — Template scale (ongoing)

- [ ] Further Free Bundle ports as demand (haircut, feane, dentcare, …)
- [ ] Postgres FTS product search
- [ ] Template embeddings for AI suggest (pgvector) — only when needed

#### Phase D — Pro/Advance features

- [ ] Live selling, smart pricing UI depth, POS, dropshipping
- [ ] Plugin provider registry (internal first)
- [ ] Paid subscription renewals hardening (PayMongo)

---

## 17. Key file index

```
# Storefront
apps/web/app/[tenantSlug]/page.tsx
apps/web/components/storefront/tenant-storefront-home.tsx
apps/web/lib/demo-data.ts
apps/web/lib/get-storefront-tenant.ts
apps/web/lib/cart.ts
apps/web/app/api/checkout/route.ts

# Admin
apps/admin/components/signup-wizard.tsx
apps/admin/components/shop-builder.tsx
apps/admin/lib/agents/run-agents.ts

# Platform
apps/platform/app/actions.ts
apps/platform/app/helpdesk/
packages/db/src/queries/platform.ts
packages/db/src/queries/support-tickets.ts

# Delivery
packages/services/src/delivery/orchestrator.ts
apps/web/lib/delivery-quote.ts
apps/admin/app/api/orders/[orderId]/book-delivery/route.ts
apps/admin/app/api/orders/[orderId]/assign-rider/route.ts
apps/web/app/api/webhooks/{lalamove,grab}/route.ts

# Themes
packages/storefront-themes/src/templates.ts
packages/storefront-themes/src/patterns.ts
packages/storefront-themes/src/template-registry.ts
packages/storefront-themes/src/bundle-catalog.ts
packages/plans/src/catalog.ts          — canonical plans (ADR D4)
packages/plans/src/ai-limits.ts

# Data
packages/db/src/schema/index.ts
packages/db/drizzle/0013_support_helpdesk.sql
packages/auth/src/service.ts
packages/ai/src/plan-limits.ts         — re-export of @guma-commerce/plans
packages/ai/src/permissions.ts
packages/services/src/payments/paymongo.ts
packages/events/

# Docs
docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md  — final review / launch sign-off
docs/AGENT-HANDOFF.md
docs/DELIVERY-AND-HELPDESK.md
docs/MVP-MANUAL-EWALLET-CHAT.md
docs/MVP-HARDENING-P1-INTEGRATION-MOCKS.md
docs/HANDBOOK-V1.2-ASSESSMENT.md
docs/ADR-0001-handbook-adoption.md
docs/CROWN-JEWEL-AI-APPROVAL.md
docs/ARCHITECTURE.md
docs/SPRINT-*-PROGRESS.md
docs/PRIORITY-SCOPE-BRAND-GUARD.md   — next product priority after launch hygiene
docs/DATABASE.md
docs/DEPLOY-VERCEL.md
packages/storefront-templates/README.md
packages/storefront-templates/BUNDLE-2023-CATALOG.md
```

---

## 18. Git state

- Prefer current branch status over this snapshot
- As of 2026-08-06: large uncommitted delta on `wip/uncommitted-work-2026-08-01` (delivery, helpdesk, chat, payments, landing polish) — **commit in slices before production**
- Do **not** commit unless explicitly requested

---

## 19. Quick verification checklist

After clone or major pull:

```powershell
pnpm install
pnpm db:migrate
pnpm --filter @guma-commerce/plans test
pnpm --filter @guma-commerce/storefront-themes exec tsc --noEmit
pnpm --filter @guma-commerce/web exec tsc --noEmit
pnpm --filter @guma-commerce/admin exec tsc --noEmit
pnpm --filter @guma-commerce/platform exec tsc --noEmit

pnpm --filter @guma-commerce/web run dev        # :3010
# http://localhost:3010/frontend1
# http://localhost:3010/demo
# http://localhost:3010/model
# http://localhost:3010/contact

pnpm --filter @guma-commerce/admin run dev      # :3001
# /messages · /orders · /settings/support · /settings/delivery-shipping

pnpm --filter @guma-commerce/platform run dev   # :3002
# login admin@guma.ph · /helpdesk · /frontends
```

---

## 20. Contacts & conventions

- **Commits:** Only when user asks
- **Scope:** Minimize diff; match existing patterns in each package
- **Template ports:** One zip at a time; always add demo + build verify
- **Plans:** Never hardcode prices/limits outside `@guma-commerce/plans`
- **Handbook:** v1.2 is target architecture — implement incrementally via ADR-0001
- **Launch review:** `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md`

---

*End of comprehensive handoff. Chief review: `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md`. Sprint progress: `docs/SPRINT-*-PROGRESS.md`. Session details: `docs/AGENT-HANDOFF.md`. Handbook: `docs/HANDBOOK-V1.2-ASSESSMENT.md`.*
