# Guma Commerce — Comprehensive Summary & Handoff

**Last updated:** 2026-07-12  
**Audience:** Next developer, architect, or AI agent continuing this repo  
**Supersedes partially:** `docs/AGENT-HANDOFF.md` (2026-07-05 session) — read both; this doc is the current whole-repo picture including template library work and Handbook v1.2 assessment.

---

## 1. Executive summary

**Guma Commerce** is a multi-tenant, AI-assisted social commerce platform for Philippine sellers. Merchants get a branded mobile storefront at `/{shop-slug}`, manage products/orders in a seller admin, and optionally use AI for content, campaigns, and buyer chat.

| Dimension | Status |
|-----------|--------|
| **Maturity** | Working MVP+ — real checkout, orders, agents, 14+ storefront themes, platform super-admin |
| **Stack** | pnpm + Turbo monorepo, Next.js 15, React 19, Drizzle + Neon Postgres |
| **Templates** | 13 HTML-ported themes live + built-in token themes; 100-template bundle catalogued |
| **Handbook** | v1.2 reviewed — hybrid adoption recommended (events + Workstation), not stack rewrite |
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
| AI Workstation | Split: **Shop Builder** + **AI Studio** + **Agents** — no unified diff/approve UI |
| 100+ templates | **14** full React ports + **~9** built-in token themes; **100** in bundle catalog only |
| Template in onboarding | Signup picks category/vibe; template chosen later in Shop Builder |
| LangGraph orchestration | Custom `packages/ai` + cron agents — **no LangGraph** |
| Event bus (Inngest) | Direct API/webhook handlers + Vercel crons |
| Prisma + RLS | **Drizzle**, app-level `tenantId` scoping |
| Plans FREE/PRO/ADVANCE | **`free` / `growth` / `pro`** (+ platform `starter`) |
| Live selling, POS, smart pricing | **Not built** |
| Commerce + logistics | **Largely built** (checkout, PayMongo, Lalamove, wallet) |

### 2.3 Agreed hybrid direction (do not rewrite from handbook verbatim)

1. **Keep** Drizzle, 3-app monolith, PayMongo-first, pattern-based TSX renderers  
2. **Add** Inngest events, unified Workstation, theme draft/publish, LangGraph for customization only  
3. **Defer** Prisma migration, plugin marketplace, ClickHouse, full pgvector memory  
4. **Map plans:** Handbook FREE → `free`, PRO → `growth`, ADVANCE → `pro`

Full assessment: see conversation handoff 2026-07-12 or request `docs/HANDBOOK-V1.2-ASSESSMENT.md` if split out later.

---

## 3. Repository structure

```
guma-commerce/
├── apps/
│   ├── web/                 # Storefront + marketing (buyer-facing)
│   ├── admin/               # Seller dashboard + signup + AI
│   └── platform/            # Super-admin console (all tenants)
├── packages/
│   ├── db/                  # Drizzle schema, migrations, queries
│   ├── ai/                  # LLM router, quotas, generators
│   ├── auth/                # JWT sessions, signup, Google OAuth
│   ├── services/            # PayMongo, Lalamove, SMS, rate-limit, push
│   ├── storefront-themes/   # Templates, patterns, registry, bundle catalog
│   ├── ui/                  # Shared Button/Card/Badge
│   └── media/               # Image-enhance prompt templates (minimal)
├── reference/               # Extracted HTML template sources
│   ├── bloomtpl-1.0.0/
│   ├── waggy-1.0.0/
│   ├── fruitables-1.0.0/
│   ├── MiniStore-1.0.0/
│   └── Free.Bundle.2023/    # 100 zips (~594 MB) — consider .gitignore
├── packages/storefront-templates/   # Human docs (README, BUNDLE catalog)
└── docs/
    ├── AGENT-HANDOFF.md             # 2026-07-05 platform session
    ├── COMPREHENSIVE-HANDOFF-2026-07-12.md   # ← this file
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
| **Platform console** | `@guma-commerce/platform` | **3002** | Super-admin: tenants, users, plans, moderation, audit |

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
   Neon Postgres  |  optional Upstash Redis  |  PayMongo / Lalamove / Semaphore
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
| `shop_chat_messages` | Buyer shop assistant history |
| `tenant_wallets`, `wallet_ledger_entries`, `tenant_payouts` | Seller wallet |
| `platform_audit_log` | Super-admin audit trail |

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
| Live integrated (this repo) | 14 |
| Variant of integrated | 11 |
| Queued storefront | 56 |
| Service landing | 16 |
| Admin dashboard | 7 |
| Content / non-storefront | 10 |

**Docs:** `packages/storefront-templates/BUNDLE-2023-CATALOG.md`  
**Priority queue:** `aircon`, `haircut`, `feane`, `dentcare`, `carserv`, `multishop`

**Not all 100 are integrated** — only catalogued and categorized.

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
| Cart (buyer) | ✅ | `apps/web/lib/cart.ts` (localStorage) |
| Checkout | ✅ | `apps/web/app/api/checkout/route.ts` |
| PayMongo | ✅ (+ mock) | `packages/services/src/payments/paymongo.ts` |
| COD | ✅ | Checkout path |
| Orders admin | ✅ | `apps/admin/app/orders/` |
| Lalamove quotes/booking | ✅ (+ mock) | `services/delivery/lalamove.ts`, webhooks |
| Wallet & payouts | ✅ schema + APIs | `api/wallet/*`, KYC flow |
| SMS (Semaphore) | ✅ | Growth+ agent reminders |
| Push notifications | ✅ | VAPID web push on order events |

---

## 10. AI & agents

**Not LangGraph** — custom implementation:

| Component | Path |
|-----------|------|
| LLM router | `packages/ai/src/providers/llm.ts` (OpenAI, Gemini, Groq, mock) |
| Quotas | `packages/ai/src/plan-limits.ts` + `ai_usage_monthly` |
| Generators | `packages/ai/src/generator.ts` |
| Agent runner | `apps/admin/lib/agents/run-agents.ts` |
| Agent UI | `/agents` — `agents-manager.tsx` |
| AI Studio | `/ai-studio` — campaign preview |
| Buyer chat | `apps/web/app/api/chat/route.ts` + `shop-assistant.tsx` |
| Crons | `apps/admin/vercel.json` |

### AI limits by plan (seller billing)

| Plan | Label | Chat/day | Generations/mo | Agent runs/week |
|------|-------|----------|----------------|-----------------|
| `free` | Sulit | 25 | 5 | 3 |
| `growth` | Growth | 200 | 100 | 14 |
| `pro` | Pro | 2000 | 500 | 999 |

Soft token budget degrades model to Gemini Flash when exceeded.

---

## 11. Platform super-admin (`apps/platform`)

Built 2026-07-05. Surfaces:

- Dashboard (MRR, GMV, charts)
- Tenants (suspend/activate/plan change)
- Users, Subscriptions, Moderation (`content_queue`)
- Orders (platform-wide), Audit log

**Plan catalog conflict:** Platform uses `PLATFORM_PLANS` (`free/starter/growth/pro` at different price points) vs seller admin (`free/growth/pro` at ₱0/499/999). **Reconcile before real billing.**

---

## 12. Subscription & billing

| Source | Plans | Notes |
|--------|-------|-------|
| Seller admin | `free`, `growth`, `pro` | ₱0 / ₱499 / ₱999 |
| AI limits | same 3 | `plan-limits.ts` |
| Platform console | + `starter` | Different MRR math |
| Handbook v1.2 | FREE, PRO, ADVANCE | Not implemented as named |

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

## 14. Recent work (2026-07-06 — 2026-07-12)

### Template integrations

- Ported: **waggy**, **fruitables**, **ministore** (React renderers + demos + registry)
- Catalogued **Free Bundle 2023** (100 templates) → `bundle-catalog.ts`, `BUNDLE-2023-CATALOG.md`
- Expanded shop categories **19 → 39**

### Fixes

- **waggy-demo:** CSS 404 (dev cache), price format (`/100` removed), hero/product images
- **fruitables-demo:** webpack HMR error — dynamic storefront imports, price fix, hero Link CTA, dead Unsplash URLs replaced
- **Dev port:** `apps/web` uses **3010** in `package.json`

### Architecture decisions (from handbook review)

- Do **not** migrate to Prisma
- Adopt **Inngest + Workstation + draft/publish** incrementally
- Keep **pattern + TSX renderer** model for templates

---

## 15. Known issues & tech debt

| Issue | Severity | Notes |
|-------|----------|-------|
| Plan price sources disagree (3–4 catalogs) | High | Blocks accurate billing/MRR |
| Drizzle migrations lag live Neon schema | High | Run `db:generate` / reconcile |
| `reference/Free.Bundle.2023/` may bloat git | Medium | Add to `.gitignore` if not needed in repo |
| README ports (3000) vs web package.json (3010) | Low | Update README |
| Demo prices: some formatters still divide by 100 | Low | Waggy/fruitables fixed; check stylish/organic/ministore |
| Many Unsplash demo URLs return 404 | Low | Replace as found |
| Suspended tenant/user not enforced on seller login/storefront | Medium | Platform can suspend; apps don't block yet |
| Email verification placeholder | Medium | Token exists; Resend not wired |
| Live selling, POS, smart pricing | — | Handbook future phases |
| LangGraph, Inngest, pgvector | — | Handbook v1.2 — not started |

### Webpack dev error (`__webpack_modules__[moduleId] is not a function`)

Usually stale `.next` cache during HMR. Fix:

```powershell
cd apps/web && pnpm run dev:clean
```

---

## 16. Recommended roadmap (post-handoff)

### Phase A — Foundation (1–2 weeks)

- [ ] Unify plan catalog to single source of truth
- [ ] Generate/reconcile Drizzle migrations
- [ ] Update README ports + point to this handoff
- [ ] Add `packages/events` + Inngest skeleton + 3 core events
- [ ] Schema: `themeDraftJson`, `customizationVersion` on tenants

### Phase B — AI Workstation (4–6 weeks)

- [ ] Unified UI: preview + controls + AI input + plan/diff panel
- [ ] Template pick in signup/onboarding
- [ ] LangGraph graph for customization → draft → approve → publish
- [ ] AI permission scopes (minimal matrix)

### Phase C — Template scale (ongoing)

- [ ] Port priority bundle templates (aircon, haircut, feane, …)
- [ ] Postgres FTS product search
- [ ] Template embeddings for AI suggest (pgvector)

### Phase D — Pro/Advance features

- [ ] Live selling, smart pricing, POS, dropshipping
- [ ] Plugin provider registry (internal first)

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
packages/db/src/queries/platform.ts

# Themes
packages/storefront-themes/src/templates.ts
packages/storefront-themes/src/patterns.ts
packages/storefront-themes/src/template-registry.ts
packages/storefront-themes/src/bundle-catalog.ts

# Data
packages/db/src/schema/index.ts
packages/auth/src/service.ts
packages/ai/src/plan-limits.ts
packages/services/src/payments/paymongo.ts

# Docs
docs/AGENT-HANDOFF.md
docs/DATABASE.md
docs/DEPLOY-VERCEL.md
packages/storefront-templates/README.md
packages/storefront-templates/BUNDLE-2023-CATALOG.md
```

---

## 18. Git state (snapshot 2026-07-12)

- Branch observed: `backup/pre-storefront-unify` (ahead of origin)
- Recent commits include platform app, orders, cart, checkout improvements
- **Much template work may be uncommitted** — verify `git status` before assuming remote state
- Do **not** commit unless explicitly requested

---

## 19. Quick verification checklist

After clone or major pull:

```powershell
pnpm install
pnpm --dir apps/web exec tsc --noEmit
pnpm --dir apps/admin exec tsc --noEmit
pnpm --dir apps/platform exec tsc --noEmit

cd apps/web && pnpm run dev:clean
# Open http://localhost:3010/waggy-demo
# Open http://localhost:3010/fruitables-demo

cd apps/admin && pnpm run dev
# Open http://localhost:3001/shop-builder

cd apps/platform && pnpm exec next dev
# Open http://localhost:3002 — login super_admin
```

---

## 20. Contacts & conventions

- **Commits:** Only when user asks
- **Scope:** Minimize diff; match existing patterns in each package
- **Template ports:** One zip at a time; always add demo + build verify
- **Handbook:** v1.2 is target architecture — implement incrementally via hybrid plan above

---

*End of comprehensive handoff. For the 2026-07-05 platform console session details, see `docs/AGENT-HANDOFF.md` § Session 2026-07-05.*
