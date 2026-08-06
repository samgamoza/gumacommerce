# Guma Commerce — Agent Handoff Document

**Last updated:** 2026-08-06 (post Chief Engineer Phases 1–6 + marketing legal refresh)  
**Purpose:** Hands-off context for the next agent or developer. Read this before making changes.

> **Chief Engineer review:** [`CHIEF-ENGINEER-REVIEW-SUMMARY.md`](./CHIEF-ENGINEER-REVIEW-SUMMARY.md)  
> **Execution prompt (binding for that pass):** [`CURSOR-CHIEF-ENGINEER-PROMPT-2026-08-06.md`](./CURSOR-CHIEF-ENGINEER-PROMPT-2026-08-06.md)  
> **Whole-repo truth:** Prefer [`COMPREHENSIVE-HANDOFF-2026-07-12.md`](./COMPREHENSIVE-HANDOFF-2026-07-12.md) for architecture, sprints, and roadmap.  
> **This file** keeps session narratives + durable pitfalls. Where they conflict, comprehensive handoff + ADR-0001 + chief summary win.

> Newest durable deltas (2026-08-06): **Phases 1–6 executed** — commit hygiene, suspend enforcement, Brand Guard A+B, helpdesk email (Resend), honest marketing, webhook/Sentry test hardening; **marketing footer + About/Privacy/Terms/Refunds/Contact UX**. Prior MVP: delivery orchestrator, helpdesk tickets, Chat MVP Beta, manual e-wallet. Detail: `DELIVERY-AND-HELPDESK.md`, `MVP-MANUAL-EWALLET-CHAT.md`, `PRIORITY-SCOPE-BRAND-GUARD.md`.

> **Deferred post-MVP beta:** Trust / Legal entity page (real SEC/TIN). **Do not start** Workstation / LangGraph / Meta Messenger without a new Chief Engineer directive (Phase 7).

---

## Session 2026-08-06 — Chief Engineer directive (Phases 1–6) + marketing legal UX

**Branch:** `wip/uncommitted-work-2026-08-01` (pushed to `origin`)  
**Binding:** ADR-0001 wins on conflict; fail-closed integrations; no Prisma/RLS/new draft tables; no killaislop SaaS.

### What landed (by phase)

1. **Phase 1 — Commit hygiene** — Prior ~130-file working tree sliced into reviewable commits (`3ac9706`…`fe645bf`): db/schema → infra/fail-closed → delivery+helpdesk → chat+manual-pay → frontend1 polish → docs.  
   - Still uncommitted locally (intentionally): `apps/*/tsconfig.tsbuildinfo`, dirty `simply-sweet-source` submodule — **ask before deciding** (gitignore vs keep).
2. **Phase 2 — Suspend enforcement** (`672783d`) — Shared `packages/db/src/tenant-access.ts`.  
   - Admin writes hard-blocked (`requireTenantSession`); dashboard shows suspended notice; `/api/shop` GET allows suspended so UI can load.  
   - Storefront shows “Shop unavailable” (not Coming soon); checkout returns **403** `TENANT_SUSPENDED`.  
   - User-level suspend blocks seller login; tenant-level suspend allows login to see the notice.  
   - **Decision:** buyer payment-proof / order tracking for open orders stays allowed.
3. **Phase 3 — Brand Guard Slice A+B** (`457a0af`) — `pnpm brand-guard:scan` + `.github/workflows/brand-guard.yml`; validators in `packages/storefront-themes/src/brand-guard.ts` wired to Launch personalize + soft hints. Slice C (Workspace polish) **not** started.
4. **Phase 4 — Helpdesk email** (`dd29aa5`) — Resend via `packages/services/src/notifications/email.ts`.  
   - New ticket → `HELPDESK_NOTIFY_EMAIL`; agent reply → requester email. Fail-closed (`sent: false`, never fake success in prod). Health id: `email`.
5. **Phase 5 — Honest marketing** (`3f2b177`) — frontend1 FAQ/comparison/footer; frontend2 Hero/HowItWorks/Pricing/etc. stripped of auto-dispatch / fake stats overclaims. `getActiveLanding()` still defaults to **frontend1**.
6. **Phase 6 — Observability / tests** (`9884ae9`) — PayMongo + Grab HMAC unit tests; Sentry in integration health; checkout errors → `createLogger`; Inngest consumers ticketed `INNGEST-001…004` (still acknowledge-only); migration journal test for `0013`.
7. **Marketing footer + legal pages** (`b220639`) — Footer CTA/hierarchy; `LegalDocLayout` TOC; About/Privacy/Terms/Refunds/Contact refreshed for soft-launch honesty.  
   - **Deferred:** Trust / Legal entity page until real SEC/TIN (post MVP beta).

### Env notes (new / important)
```
RESEND_API_KEY=
EMAIL_FROM=
HELPDESK_NOTIFY_EMAIL=
NEXT_PUBLIC_PLATFORM_URL=http://localhost:3002
SENTRY_DSN=   # set on web + admin + platform Vercel projects
PAYMENTS_MODE=manual_ewallet
```

### Commands that should be green
```powershell
pnpm --filter @guma-commerce/db exec tsc --noEmit
pnpm --filter @guma-commerce/web exec tsc --noEmit
pnpm --filter @guma-commerce/admin exec tsc --noEmit
pnpm --filter @guma-commerce/platform exec tsc --noEmit
pnpm --filter @guma-commerce/db test
pnpm --filter @guma-commerce/services test
pnpm --filter @guma-commerce/storefront-themes test
pnpm brand-guard:scan
```

### Open / next (after this pass)
| Priority | Item |
|----------|------|
| Ops | Prod env checklist (`DEPLOY-VERCEL.md`): AUTH_SECRET, DATABASE_URL*, URLs, demo flag, payment/delivery/email/Sentry keys |
| Ops | Keep platform `active_landing` = **frontend1** for soft launch |
| Content | Real SEC / TIN / phone when available → then Trust / Legal entity page |
| Housekeeping | Decide `*.tsbuildinfo` gitignore; clean `simply-sweet-source` dirty submodule |
| Eng (later) | Brand Guard Slice C; fill Inngest stubs `INNGEST-001…004`; broader E2E |
| **Do not** | Workstation convergence / Meta Messenger / 100-template push without new directive |

### Recommended next prompt
> Read `docs/AGENT-HANDOFF.md` (this file) + `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md`. Branch `wip/uncommitted-work-2026-08-01` is pushed through Phases 1–6 + marketing legal UX. Next: prod cutover checklist / PR review — not Workstation. Constraints: never `db:push`; never `@guma-commerce/db` from `"use client"`; fail-closed integrations; ADR-0001.

---

## Session 2026-08-05 → 2026-08-06 — MVP ops: chat, delivery, helpdesk, Frontend1

### What landed
1. **Chat MVP Beta (owner-led)** — storefront Message seller + AI FAQ; seller `/messages`; WhatsApp overflow; no Messenger/websockets.
2. **Manual e-wallet** — buyer proof/reference; seller confirm-payment; `PAYMENTS_MODE`.
3. **Delivery** — quote/checkout/book via orchestrator (Lalamove ↔ Grab failover → manual); Grab webhook; **Assign rider** for Angkas/Move It/own rider.
4. **Helpdesk** — `support_tickets` + migration `0013`; web `/contact` creates tickets; admin Help & support; platform `/helpdesk` with SLA (4h / 48h).
5. **Frontend1 polish** — working mobile nav; same-origin `/model`; contact→ticket; storefront default port **3010**; hero CTAs → demo + signup.
6. **Seller UI calm-down** + products manual-first (AI enhance / suggest price only).

### Ports (local)
| App | Port |
|-----|------|
| web | **3010** (not 3000) |
| admin | 3001 |
| platform | 3002 |

### Quick verify
```powershell
pnpm db:migrate
pnpm --filter @guma-commerce/web run dev
pnpm --filter @guma-commerce/admin run dev
pnpm --filter @guma-commerce/platform run dev
# :3010/frontend1 · :3010/contact · :3001/messages · :3002/helpdesk
```

### Constraints (unchanged)
- Never `db:push`; never `@guma-commerce/db` from `"use client"`
- Never hardcode plan prices outside `@guma-commerce/plans`
- Production mocks refused — see `MVP-HARDENING-P1-INTEGRATION-MOCKS.md`

### Status note
Soft-launch hygiene from the prior “recommended next” is largely **done** in the 2026-08-06 Chief Engineer session (see section above). Prefer that section for current open items.

---

## Session 2026-07-05 — Brand redesign + Platform (super-admin) console

### 1. Project overview (delta)
Three Next.js 15 (App Router, React 19) apps now exist in the `pnpm`+Turbo monorepo, all sharing `packages/*`:

| App | Path | Port | Role |
|-----|------|------|------|
| Storefront + marketing | `apps/web` | **3010** | `/{tenantSlug}` shops, checkout, buyer chat |
| Seller admin | `apps/admin` | 3001 | Per-tenant dashboard (one shop) |
| **Platform console (NEW)** | `apps/platform` | 3002 | **Super-admin over ALL tenants** |

Stack unchanged: TypeScript, Tailwind v3, Drizzle ORM → **Neon Postgres** (live, Singapore), JWT cookie auth (`jose`, cookie `gumacommerce_session`) in `packages/auth`, `bcryptjs` passwords. AI providers + PayMongo/Lalamove/Semaphore unchanged. Deployment target: Vercel (one project per app).

### 2. What was built this session
1. **Guma brand system ported into `apps/admin`** — the emerald/amber HSL design tokens, Bricolage Grotesque + Plus Jakarta Sans fonts, `hero-glow`/grid utilities, and animations from `apps/web` (landing redesign, commit `5facdd1`). Admin sidebar/header/dashboard redesigned with lucide icons (replacing violet theme + emoji nav).
2. **Seller storefront polish** — fixed off-brand violet in owner menu, accent-tinted checkout button, rebranded the "shop being set up" pending page, friendlier empty catalog state.
3. **`apps/platform` — a brand-new super-admin console** (the bulk of the session). Distinct dark-emerald sidebar to differentiate from the seller admin. Surfaces: Dashboard (MRR/GMV/shops/users KPIs + SVG revenue/signup charts + plan/status bars), Tenants (filterable list → detail with suspend/activate/set-pending/change-plan/view-storefront), Subscriptions (plan catalog + MRR/ARR/ARPU + per-shop plan mgmt), Users (role change + suspend/reactivate), Moderation (`content_queue` approve/reject/flag), Orders (platform-wide), Audit Log.
4. **DB schema additions** (see §4) + seeded a `super_admin`.

### 3. Files created / modified

**New — `apps/platform/` (entire app):**
- Config: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next-env.d.ts`, `middleware.ts`
- `app/`: `globals.css`, `layout.tsx`, `page.tsx` (dashboard), `login/page.tsx`, `actions.ts` (server actions for all mutations), `tenants/page.tsx`, `tenants/[id]/page.tsx`, `subscriptions/page.tsx`, `users/page.tsx`, `moderation/page.tsx`, `orders/page.tsx`, `audit/page.tsx`, `api/auth/{login,logout,session}/route.ts`
- `components/`: `platform-shell.tsx`, `ui.tsx` (StatCard/StatusPill/PlanBadge/AreaChart/BarMeter/EmptyState/Panel), `login-form.tsx`, `filter-bar.tsx` (URL-synced), `tenant-actions.tsx`, `user-actions.tsx`, `plan-select.tsx`, `moderation-actions.tsx`
- `lib/`: `session.ts` (`requireSuperAdmin`), `api-auth.ts` (`requireSuperAdminApi`), `format.ts`, `plans.ts` (**client-safe** plan catalog — see pitfall in §6)

**New — db package:** `packages/db/src/queries/platform.ts` (all platform reads/writes + `PLATFORM_PLANS` catalog).

**Modified:**
- `packages/db/src/schema/index.ts` — added `users.status`, `content_queue` moderation cols, `platform_audit_log` table.
- `packages/db/src/index.ts` — re-export platform queries/types.
- `apps/admin/app/{globals.css,layout.tsx}`, `apps/admin/tailwind.config.ts`, `apps/admin/components/{admin-shell,dashboard-view}.tsx` — brand redesign.
- `apps/web/app/[tenantSlug]/page.tsx`, `apps/web/components/storefront/{shop-shell,shopify-catalog}.tsx` — storefront polish.

> ⚠️ The working tree also has **unrelated uncommitted changes from a prior session** (orders manager, cart, checkout/paymongo, `packages/db/src/queries/orders.ts`, etc.). Those were **not** touched this session — don't attribute or bundle them blindly.

### 4. Database changes (APPLIED to live Neon)
Applied via a **surgical idempotent SQL script** (`ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`) — **NOT** `drizzle-kit push`, which failed trying to drop/rebuild a pre-existing primary key (`column "id" is in a primary key`). **Do not run `db:push` against this DB** — use targeted SQL or a proper generated migration.

Added:
- `users.status varchar(20) NOT NULL DEFAULT 'active'` — values `active | suspended`.
- `content_queue`: `flagged bool NOT NULL DEFAULT false`, `moderation_note text`, `moderated_by uuid → users`, `moderated_at timestamptz`, + `content_queue_flagged_idx`.
- New table `platform_audit_log` (id, actor_id, actor_email, action, entity_type, entity_id, entity_label, metadata_json, created_at) + 3 indexes.

**Schema drift note:** these are in `schema/index.ts` but **no drizzle migration file was generated** — the DB and schema agree, but `packages/db/drizzle/` is behind. Next agent should `pnpm db:generate` and reconcile before the next real migration.

### 5. Auth for the platform console
- Login: **`admin@guma.ph` / `GumaAdmin2026!`** (seeded super_admin; change before any shared/prod use).
- Only `role === 'super_admin'` may enter — enforced in `apps/platform/middleware.ts` AND `app/api/auth/login/route.ts`. Reuses the shared `gumacommerce_session` cookie + `packages/auth` token helpers (no changes to `packages/auth`).
- All mutations run through **server actions** in `app/actions.ts`, each guarded by `requireSuperAdminApi()` and writing a `platform_audit_log` row + `revalidatePath`.

### 6. Critical pitfalls / decisions
- **Client components must NOT import from `@guma-commerce/db`.** The package barrel pulls `client.ts` → `postgres` → node `net`, which breaks the browser bundle (`Can't resolve 'net'`) and 500s *every* page. Client-safe plan list: `apps/platform/lib/plans.ts` re-exports `@guma-commerce/plans` (`CLIENT_PLANS`). Server components/actions may still import from `@guma-commerce/db`.
- **~~Plan catalog inconsistency~~ → resolved (Sprint 4 / ADR D4).** Single source: `@guma-commerce/plans` (₱0 / ₱499 / ₱999; labels Free / Pro / Advance). Thin re-exports remain on db/ai for compat. Legacy `starter` rows normalize to `growth`.
- Charts are dependency-free inline SVG (`AreaChart`, `BarMeter` in `components/ui.tsx`) — no chart lib added.
- Pages are **server components** (direct query calls, no client fetch/loading states) + server actions for writes — the modern idiom, differs from `apps/admin`'s client-fetch+API-route pattern.

### 7. Verification done
- `tsc --noEmit` clean: `apps/platform` and `packages/db`.
- Platform dev server (port 3002) compiles; all 7 routes return 200 with live data (MRR ₱2,999 from 1 Pro shop; 4 shops; 4 users).
- End-to-end mutation tested: activated a pending tenant → status flipped + success toast + audit-log row with actor/label. **Test change was reverted** (tenant back to `pending`, test audit row deleted) — live data is clean.
- Not yet run: `next build` (production) for `apps/platform`; no automated tests exist.

### 8. Pending / recommended next steps (this session's scope)
- **High:** `pnpm db:generate` to create the migration file for the schema additions (DB is ahead of `drizzle/`).
- ~~**High:** Reconcile the 3 plan-price sources~~ — **done** (`@guma-commerce/plans`).
- **Medium:** `next build` the platform app; add it to CI/Vercel (new project, port 3002, same monorepo build command, needs `AUTH_SECRET` + `DATABASE_URL*`).
- ~~**Medium:** Enforce suspended user/tenant on seller + storefront~~ — **done** (2026-08-06 Phase 2; see top session).
- **Low:** Moderation currently only covers `content_queue`; extend to products if needed. Add pagination to platform tables (currently limit 200–500).
- **Housekeeping:** Prefer `COMPREHENSIVE-HANDOFF` + sprint docs for post-2026-07-05 work; current open items live in the **2026-08-06 Chief Engineer** session section above.

### 9. Next-agent quick start (platform work)
```cmd
cd C:\Users\samga\gumacommerce
pnpm install
pnpm --dir apps/platform exec next dev   # → http://localhost:3002, login admin@guma.ph / GumaAdmin2026!
pnpm --dir apps/platform exec tsc --noEmit
```
Inspect first: `apps/platform/app/actions.ts`, `packages/db/src/queries/platform.ts`, `apps/platform/components/platform-shell.tsx`, `apps/platform/lib/plans.ts`. **Warning:** never import `@guma-commerce/db` from a `"use client"` file; never run `db:push`.

### 10. Recommended next prompt (paste to continue)
> You're working in the `guma-commerce` pnpm+Turbo monorepo at `D:\All Apps\gumacommerce`. Read `docs/AGENT-HANDOFF.md` (top session 2026-08-06) + `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md`. Branch `wip/uncommitted-work-2026-08-01` is pushed through Chief Engineer Phases 1–6 + marketing legal UX. Apps: `web` (:3010), `admin` (:3001), `platform` (:3002). **Open:** prod cutover / secrets / demo flag; real SEC/TIN then Trust page; tsbuildinfo/submodule housekeeping; Brand Guard Slice C + Inngest fill-out later. **Do not** start Workstation without a new directive. Constraints: never import `@guma-commerce/db` from `"use client"`; never `db:push`; never hardcode plan prices outside `@guma-commerce/plans`; fail-closed integrations.

---

## 1. Product summary

**Guma Commerce** is an AI-powered social commerce platform for Philippine sellers.

| Surface | Path | Port | Role |
|---------|------|------|------|
| Storefront | `apps/web` | **3010** | Marketing + `/{tenantSlug}` shops, checkout, buyer chat, webhooks |
| Admin | `apps/admin` | 3001 | Seller dashboard, messages, orders, Launch/Workspace, settings |
| Platform | `apps/platform` | 3002 | Super-admin: tenants, helpdesk, frontends, moderation, audit |

**Core value:** Turn social traffic into a branded mobile storefront with GCash/Maya/COD, delivery stubs, AI content, and agentic daily posting workflows.

**Buyer chatbot** = pre-checkout assistant on storefront (`POST /api/chat`).  
**WhatsApp Agent** (Settings) = seller business number config — not the same as buyer chat.

---

## 2. Repository state (as of handoff)

| Item | Status |
|------|--------|
| **Local folder** | `C:\Users\samga\gumacommerce` (active repo; pushes work here) |
| **Git** | Branch `master`; latest commit `5facdd1` (landing redesign). 2026-07-05 work is **uncommitted** in the working tree |
| **npm scope** | `@guma-commerce/*` (rebrand complete in source) |
| **Root package name** | `guma-commerce` |
| **Production deploy** | Not done — docs ready in `docs/DEPLOY-VERCEL.md` |
| **DB (Neon)** | Migrations `0000` + `0001` applied; `pnpm db:reconcile` run once to fix partial `db:push` drift |
| **Build** | `pnpm turbo build --filter=@guma-commerce/web --filter=@guma-commerce/admin` passes |

---

## 3. Monorepo layout

```
guma-commerce/                    
├── apps/
│   ├── web/                     @guma-commerce/web
│   └── admin/                   @guma-commerce/admin
├── packages/
│   ├── ai/                      @guma-commerce/ai      — prompts, generator, plan limits, LLM router
│   ├── auth/                    @guma-commerce/auth     — sessions, Google OAuth, signup
│   ├── db/                      @guma-commerce/db       — Drizzle schema, migrations, queries
│   ├── services/                @guma-commerce/services — PayMongo, Lalamove, Semaphore SMS
│   ├── storefront-themes/       @guma-commerce/storefront-themes
│   ├── ui/                      @guma-commerce/ui       — shared Button, Card, Badge, etc.
│   └── media/                   @guma-commerce/media    — (minimal / stub)
├── docs/
│   ├── AGENT-HANDOFF.md         ← this file
│   ├── DATABASE.md
│   └── DEPLOY-VERCEL.md
├── docker-compose.yml           — local Postgres on port 5434, DB name `guma_commerce`
├── .env.example
└── turbo.json
```

---

## 4. Brand & naming conventions

| Context | Use |
|---------|-----|
| User-facing product | **Guma Commerce** |
| Company | Guma Commerce Technologies (`apps/web/lib/site-content.ts`) |
| npm packages | `@guma-commerce/*` |
| Subscription plan IDs (DB / billing) | `free`, `growth`, `pro` (stable forever) |
| Marketing / UI plan names | **Free**, **Pro**, **Advance** (constitution) — from `@guma-commerce/plans` |
| Handbook mapping | FREE→`free`, PRO→`growth`, ADVANCE→`pro` |
| Aliases (normalize at read) | `starter`→`growth`, `advance`→`pro`, `sulit`→`free` |
| Shop URL display | `{NEXT_PUBLIC_ROOT_DOMAIN}/{slug}` — default host `gumacommerce.ph` |
| Emails | `hello@gumacommerce.ph`, `support@gumacommerce.ph`, `privacy@gumacommerce.ph` |

**Do not reintroduce** Sulit / Growth / Pro as seller-facing labels, or invent Free/Starter/Growth/Pro as DB IDs. Canonical module: `@guma-commerce/plans` (ADR D4).

**Do not reintroduce** any legacy pre-rebrand brand names, domains, or package scopes. The brand is **Guma Commerce** (`gumacommerce`) everywhere.

**Internal globals (DB client):** `__gumaCommerceDb`, `__gumaCommerceSql` in `packages/db/src/client.ts`.

---

## 5. Architecture (high level)

```mermaid
flowchart TB
  subgraph web [apps/web :3000]
    Storefront["/{slug} storefront"]
    Chat["POST /api/chat"]
    Checkout["POST /api/checkout"]
  end

  subgraph admin [apps/admin :3001]
    AgentsUI["/agents"]
    AIStudio["/ai-studio"]
    Settings["/settings/*"]
    CronAgents["GET /api/cron/agents"]
    CronSMS["GET /api/cron/agent-reminders"]
  end

  subgraph packages [packages]
    AI["@guma-commerce/ai"]
    DB["@guma-commerce/db"]
    Auth["@guma-commerce/auth"]
    Svc["@guma-commerce/services"]
  end

  Neon[(Neon Postgres)]

  Storefront --> DB
  Chat --> AI
  Chat --> DB
  AgentsUI --> AI
  AgentsUI --> DB
  CronAgents --> AI
  admin --> Auth
  web --> Svc
  admin --> Svc
  DB --> Neon
```

---

## 6. Database

**ORM:** Drizzle · **Production:** Neon (Singapore) · **Local:** Docker Postgres `:5434`.

### Migrations (use these, not `db:push` in prod)

| File | Contents |
|------|----------|
| `packages/db/drizzle/0000_slippery_ultimates.sql` | Core schema (tenants, products, orders, …) |
| `packages/db/drizzle/0001_sweet_mandroid.sql` | Agent tables + enums |

### Agent-related tables (0001)

- `content_queue` — drafted/approved/scheduled/posted social content
- `agent_runs` — run history
- `shop_chat_messages` — buyer chat logs
- `ai_usage_monthly` — quota tracking per tenant/month

### Key queries

| Module | Path |
|--------|------|
| Agents CRUD | `packages/db/src/queries/agents.ts` |
| AI usage counts | `packages/db/src/queries/ai-usage.ts` |
| Order insights (7d) | `packages/db/src/queries/order-insights.ts` |
| Tenant settings types | `packages/db/src/types/tenant-settings.ts` |

### Migration gotcha

A prior `db:push` partially applied agent schema before failing. Fix:

```cmd
pnpm db:reconcile   # if agent tables exist but 0001 not in journal
pnpm db:migrate
```

Inspect DB state: `pnpm db:inspect`.

### Env URL resolution

`packages/db/src/env.ts` supports:

- **Neon + Vercel:** `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct)
- **Local .env:** `DATABASE_URL` (direct), `DATABASE_URL_POOLED` (pooled)

---

## 7. Agents system

### Admin UI — `/agents`

`apps/admin/components/agents-manager.tsx`

- Content queue (approve / skip / copy / mark posted)
- Schedule config (daily/weekly/manual, channels, time)
- Shop assistant settings
- **Daily briefing** — rule-based, grounded in `getOrderInsightsLast7d`
- Usage meters vs plan limits
- Content calendar

### Run agents (manual)

`POST /api/agents/run` — body `{ agentKey: "posting" | "campaign" | "all" }`  
Gated by `assertAiQuota` in `apps/admin/lib/agents/usage-gate.ts`.

### Cron (admin only)

Configured in `apps/admin/vercel.json`:

| Schedule (UTC) | Path | Purpose |
|----------------|------|---------|
| `0 10 * * *` | `/api/cron/agents?mode=daily` | Daily posting agent (~6 PM PHT) |
| `0 2 * * 1` | `/api/cron/agents?mode=weekly` | Weekly campaign agent |
| `0 9 * * *` | `/api/cron/agent-reminders` | SMS nudge (Pro+ / `growth`+) |

Requires `CRON_SECRET` on admin Vercel project. Cron routes also enforce plan quotas.

### Order-aware prompts

`apps/admin/lib/agents/run-agents.ts` uses bestsellers + 7-day order insights in prompts.

### Not built (Phase 2+)

- Meta/TikTok OAuth auto-publish
- Unified Messenger/IG inbox
- LLM-generated briefing (currently rule-based)

---

## 8. AI package

**Path:** `packages/ai/`

| File | Role |
|------|------|
| `@guma-commerce/plans` (`packages/plans`) | Canonical `PLAN_AI_LIMITS`, catalog, `normalizePlanId` |
| `src/plan-limits.ts` | Thin re-export of `@guma-commerce/plans` (compat) |
| `src/permissions.ts` | `SCOPE_MATRIX` + approval levels |
| `src/providers/llm.ts` | OpenAI, Gemini, Groq, mock fallback |
| `src/generator.ts` | Template-based generation with plan routing |

### Plan limits (summary)

| Plan ID | Label | Agent runs/week | Chat/day | Generations/mo | SMS reminders | Models |
|---------|-------|-----------------|----------|----------------|---------------|--------|
| `free` | Free | 3 | 25 | 5 | No | gemini-2.0-flash |
| `growth` | Pro | 14 (2/day cap) | 200 | 100 | Yes | gpt-4o-mini |
| `pro` | Advance | 999 (10/day cap) | 2000 | 500 | Yes | gpt-4o-mini posts, gpt-4o campaigns |

**Env for live AI:** `OPENAI_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_AI_API_KEY`), optional `GROQ_API_KEY`.

---

## 9. Settings (admin)

Expandable sidebar under **Settings**. Stored in `tenants.settingsJson`.

| Page | Path | Key |
|------|------|-----|
| Shop | `/settings/shop` | COD, min order, auto-accept |
| Delivery | `/settings/delivery-shipping` | Lalamove/flat rate/pickup |
| Notifications | `/settings/notifications` | Email/SMS toggles |
| Subscription | `/settings/subscription` | Plan switch (free/growth/pro) |
| Tracking | `/settings/tracking` | FB Pixel, GA, TikTok Pixel |
| WhatsApp Agent | `/settings/whatsapp-agent` | Seller WA number |

Storefront reads settings for checkout fees, promo banner, tracking pixels, WhatsApp float button.

API: `GET/PATCH /api/settings`.

---

## 10. AI Studio

**Path:** `apps/admin/app/ai-studio/` + `components/ai-studio-campaign.tsx`

Dark “Guma Campaign Studio” preview UI. Modules: Brand Kit, Video Studio, Campaign Manager, Auto-publish (**coming soon**). Uses live shop data via `/api/shop`. All Pixury references were replaced with Guma.

---

## 11. Storefront shop assistant

- Component: `apps/web/components/storefront/shop-assistant.tsx`
- API: `apps/web/app/api/chat/route.ts`
- Quota: `apps/web/lib/ai-quota.ts`

---

## 12. Auth

**Package:** `packages/auth/`  
**Admin middleware:** `apps/admin/middleware.ts`

- Email/password + Google OAuth
- Session cookie via `AUTH_SECRET` (32+ chars in production)
- Google callback: `/api/auth/google/callback`
- Signup slug prefix from `shopUrlDisplayPrefix()` in `apps/admin/lib/utils.ts`

---

## 13. Environment variables

Copy from `.env.example`. Minimum for local dev:

```env
DATABASE_URL=...                    # direct (Neon) or local Docker
DATABASE_URL_POOLED=...             # optional local; Neon uses DATABASE_URL as pooled
AUTH_SECRET=...
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3010
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
NEXT_PUBLIC_ROOT_DOMAIN=gumacommerce.ph
GEMINI_API_KEY=...                  # recommended for free-tier agents
```

Production / cron / SMS:

```env
CRON_SECRET=...
SEMAPHORE_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Both Next apps load root `.env` via `next.config.ts` (`loadRootEnv()`).

---

## 14. Commands

```cmd
pnpm install

# Dev (prefer dev:clean after build or CSS issues)
pnpm --filter @guma-commerce/web dev
pnpm --filter @guma-commerce/admin dev:clean

# Typecheck / build
pnpm turbo build --filter=@guma-commerce/web --filter=@guma-commerce/admin

# Database
pnpm db:migrate
pnpm db:reconcile      # one-time fix if needed
pnpm db:seed
pnpm db:studio
pnpm db:generate       # after schema edits → commit new SQL

# Local Docker Postgres
pnpm db:up
```

---

## 15. Known gotchas

| Issue | Fix |
|-------|-----|
| Admin CSS unstyled / webpack `reading 'call'` | Stale `.next` — stop dev, run `dev:clean`. **Never run `turbo build` while dev server is running on same app.** |
| `db:push` primary key errors | Use `db:migrate` + `db:reconcile` instead |
| `relation "content_queue" does not exist` | Run `pnpm db:migrate` against connected DB |
| Admin 500 after deleting `.next` while dev running | Restart dev server |
| Package not found after rebrand | `pnpm install`; scope is `@guma-commerce/*` |
| Plan shows `free` in DB but UI says Free | Always resolve via `@guma-commerce/plans` (`planDisplayName` / `SELLER_PLANS`) |

---

## 16. Marketing site audit (fixed vs remaining)

### Fixed in rebrand pass

- Navbar `/#features`, `/#how-it-works`
- FAQ anchors: `#payments`, `#delivery`, `#ai`
- Pricing: Free / Pro / Advance aligned with admin (₱0 / ₱499 / ₱999) via `@guma-commerce/plans`
- Removed all legacy pre-rebrand brand names and domains
- Blog: removed broken `#` read-more links
- Footer: removed placeholder social `href="#"`

### Still placeholder (OK for pre-beta, fix before launch)

| Item | Location |
|------|----------|
| SEC/BIR registry `[Pending]` | `apps/web/lib/site-content.ts` → footer, about |
| Contact form (no submit API) | `apps/web/app/contact/page.tsx` |
| Status page (static, not monitored) | `apps/web/app/status/page.tsx` |
| Blog (teasers only, no articles) | `apps/web/app/blog/page.tsx` |
| Mobile nav menu (button only) | `apps/web/components/landing/navbar.tsx` |
| Paid billing not wired | subscription-settings copy |

---

## 17. Deployment checklist (not done)

See **`docs/DEPLOY-VERCEL.md`**.

1. Initial git commit + push to GitHub
2. Two Vercel projects: `apps/web`, `apps/admin`
3. Neon ↔ Vercel integration for DB env vars
4. Set all env vars on both projects (Production + Preview)
5. `pnpm db:migrate` against production Neon
6. Google OAuth prod redirect URI on admin domain
7. Enable Vercel cron on admin (Pro plan may be required)
8. Smoke test: login → `/agents` → storefront `/demo` → chatbot

**Build command (each app):**

```bash
cd ../.. && pnpm install && pnpm turbo build --filter=@guma-commerce/web
# or @guma-commerce/admin
```

---

## 18. Recommended next work (priority order)

1. **Git + Vercel pre-beta** — first commit, GitHub remote, preview deploy, env vars, migrate prod DB
2. ~~Rename local folder~~ — done; repo now lives at `C:\Users\samga\gumacommerce`
3. **Contact form backend** — email or store inquiries (Resend, Semaphore, etc.)
4. **Meta/TikTok OAuth** — auto-publish from content queue (Phase 2)
5. **Paid billing** — PayMongo subscriptions for Pro/Advance (`growth`/`pro` IDs)
6. **Mobile nav drawer** — marketing site
7. **LLM daily briefing** — optional upgrade over rule-based `buildDailyBriefing`
8. **SEC/BIR + social URLs** — replace placeholders in `site-content.ts`

---

## 19. Key file index

```
packages/db/src/schema/index.ts          — full Drizzle schema
packages/db/src/reconcile-migrations.ts  — migration journal repair
packages/ai/src/plan-limits.ts           — quotas & model routing
packages/ai/src/generator.ts
apps/admin/lib/agents/run-agents.ts
apps/admin/lib/agents/briefing.ts
apps/admin/lib/agents/usage-gate.ts
apps/admin/components/agents-manager.tsx
apps/admin/components/ai-studio-campaign.tsx
apps/admin/app/api/cron/agents/route.ts
apps/admin/app/api/cron/agent-reminders/route.ts
apps/web/app/api/chat/route.ts
apps/web/components/storefront/shop-assistant.tsx
apps/web/lib/site-content.ts             — marketing copy, FAQ, footer links
apps/admin/app/api/settings/route.ts
packages/auth/src/service.ts
apps/admin/middleware.ts
.env.example
```

---

## 20. Session history (what prior agents built)

Chronological summary for context:

1. **Settings menu** — wired saves to DB; storefront applies checkout/delivery/tracking/WhatsApp
2. **Rebrand** — user-facing copy → Guma Commerce; bulk rebrand once broke `client.ts` with invalid identifiers (fixed)
3. **AI Studio** — Guma Campaign Studio UI; Pixury → Guma
4. **Agents roadmap** — plan limits, model routing, order-aware agents, daily briefing UI, SMS reminders, shop assistant chatbot
5. **DB** — migration 0001 for agent tables; `db:reconcile` for push drift
6. **Vercel prep** — `vercel.json` crons, DEPLOY-VERCEL.md, `.env.example` expansion
7. **CSS incident** — corrupted `.next` from build+ddev overlap; fixed with `dev:clean`
8. **Full rebrand pass** — legacy npm scope → `@guma-commerce`, pricing/plan alignment, link fixes, production build verified

**User preference:** No git commits unless explicitly requested (repo still uncommitted at handoff).

---

## 21. Quick verification script

After any major change, run:

```cmd
pnpm --filter @guma-commerce/admin typecheck
pnpm --filter @guma-commerce/web typecheck
pnpm turbo build --filter=@guma-commerce/web --filter=@guma-commerce/admin
pnpm db:migrate
```

Manual smoke:

- http://localhost:3001/login → dashboard
- http://localhost:3001/agents → briefing + usage meters
- http://localhost:3010/demo → storefront + shop assistant bubble
- Run daily posts (needs `GEMINI_API_KEY` or mock fallback)

---

*End of handoff. For DB details see `DATABASE.md`. For deploy steps see `DEPLOY-VERCEL.md`.*
