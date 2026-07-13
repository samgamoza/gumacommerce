# GUMA ai-Commerce Architecture

**Status:** Living document (Phase 0–4 breadth in progress)  
**Stack of record:** Next.js 15 · React 19 · **Drizzle ORM** · Neon Postgres · pnpm + Turbo · **Inngest** (events) · **change_requests** (draft→approve→publish)  
**Not used:** Prisma (do not migrate)

---

## Apps

| App | Port | Role |
|-----|------|------|
| `apps/web` | 3010 | Buyer storefront + marketing |
| `apps/admin` | 3001 | Seller: **Launch**, Appearance, **Workspace** (Pro+), dashboard |
| `apps/platform` | 3002 | Super-admin |

---

## Domains (bounded contexts)

| Domain | Owns | Package / location |
|--------|------|--------------------|
| Identity | Users, sessions | `packages/auth` |
| Tenancy | Tenants, Store DNA, plans | `packages/db` tenants + `plans.ts` |
| Templates | Packages, scoring, brand kit | `packages/storefront-themes` |
| Storefront | Published render | `apps/web` + theme patterns |
| Launch | Draft → publish wizard | `apps/admin/app/launch` + launch queries |
| Commerce | Products, orders | `packages/db` queries |
| Payments | PayMongo, COD | `packages/services` |
| Shipping | Lalamove | `packages/services` |
| AI | Quotas, generation (Workspace) | `packages/ai` |
| Events | Domain events (Phase 2) | `packages/events` |
| Billing | Plan upgrades | `packages/db` plan-billing |
| Platform | Audit, moderation | `apps/platform` |

---

## Theme lifecycle (Phase 1)

```
theme_draft_json  ← Launch personalize + Shop Builder (Appearance)
        ↓ publish (merchant approval)
theme_published_json  ← Buyer storefront reads this
theme_json            ← Legacy working copy (kept in sync on publish for compatibility)
```

Storefront resolution order: `theme_published_json` → fallback `theme_json`.

---

## GUMA Launch flow

```
/signup → /launch (DNA) → /launch/templates → /launch/personalize → /launch/preview → /launch/publish
```

Zero LLM. Template Top 3 from deterministic scoring.

---

## Plans (single source of truth)

`packages/db/src/plans.ts` — import from server code.  
`apps/platform/lib/plans.ts` — client-safe mirror (keep in sync).

---

## Event catalog (Phase 2 — live)

Package: `packages/events`. Persist: `domain_events` table. Serve: `apps/admin/api/inngest`.

| Event | Emitted from |
|-------|----------------|
| `Tenant.Created.V1` | Signup / Google complete-shop |
| `Store.Published.V1` | Launch publish |
| `Theme.ChangeApproved.V1` | Launch publish / Approvals approve |
| `Theme.Published.V1` | Launch publish / Approvals publish |
| `Theme.RolledBack.V1` | Approvals rollback |
| `Catalog.ChangeApproved.V1` | AI product generate save / Approvals catalog publish |
| `Pricing.ChangeApproved.V1` | AI price suggest save / Approvals pricing publish |
| `Order.PaymentSucceeded.V1` | PayMongo webhook (order paid) |
| `Merchant.Upgraded.V1` | PayMongo webhook (plan upgrade) |
| `AI.PlanCompleted.V1` | Schema ready; emit when Workspace plans ship |

Local: `npx inngest-cli@latest dev -u http://localhost:3001/api/inngest`  
Prod: `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`

---

## GUMA Workspace (Phase 3)

Paid AI operator (growth = Pro, pro = Advance). Routes:

- `/workspace` — overview
- `/workspace/approvals` — **Crown jewel** diffs, approve/publish/rollback + tenant audit (available on Free)
- `/workspace/marketing` — campaign studio (was `/ai-studio`)
- `/workspace/automations` — agents queue (was `/agents`)

Legacy `/ai-studio` and `/agents` redirect into Workspace modules.

### Crown jewel rails

- Table: `change_requests` (draft → pending_review → approved → published / rejected / rolled_back)
- Permission matrix: `packages/ai/src/permissions.ts`
- Launch Publish creates + approves + publishes a **theme** change request with audit
- AI product generate creates a **catalog** change request; Products save / Approvals publish applies it
- UI: `/workspace/approvals` (theme + catalog + pricing + SEO diffs; theme + SEO rollback)

### Phase 4 breadth (in progress)

| Domain | Status |
|--------|--------|
| Theme | Live (Launch + Approvals) |
| Catalog | Live (AI product generate → change request → publish) |
| Pricing | Live (AI suggest price → change request → apply) |
| SEO | Live (Workspace SEO + AI suggest → CR → Approvals publish; storefront metadata / robots / sitemap / JSON-LD) |
| Checkout | Live (Workspace Checkout + AI suggest → CR → Approvals publish; cart session, tax/coupons, payment adapters, Order.Created/Succeeded + Checkout.Abandoned) |
| Shipping | Live (Workspace Shipping + AI suggest → CR → Approvals publish; profiles/zones/rates/courier/pickup/ETA; mirrors `settings_json.delivery`) |
| Plan catalog (ADR D4) | Live — `@guma-commerce/plans` (ids `free`/`growth`/`pro`; labels Free/Pro/Advance; aliases `starter`/`advance`/`sulit`) |
| Priority template ports | Live — `aircon` → `carserv` → `motto` → `studio` (demos `/{id}-demo`; catalog status `integrated`) |

---

## Constitution

See `docs/CONSTITUTION.md`.
