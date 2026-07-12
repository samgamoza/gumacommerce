# Handbook v1.2 — Assessment & Adoption Map

**Date:** 2026-07-12
**Status:** Reference (companion to `COMPREHENSIVE-HANDOFF-2026-07-12.md` §2)
**Related:** `ADR-0001-handbook-adoption.md` (binding decisions), `CROWN-JEWEL-AI-APPROVAL.md` (implementation)

> Purpose: give any developer or coding agent (Cursor, Claude, etc.) a single, grounded view of **which parts of "Guma AI Commerce Implementation Handbook v1.2" to adopt, adapt, defer, or reject** — so contributions stay uniform and nobody "follows the Handbook" into an unnecessary rewrite.

---

## 1. Bottom line

Handbook v1.2 is a strong **enterprise blueprint**, but it describes a heavier and partly different system than the one in this repo. It is stamped "Approved for Development"; **do not read that as "implement verbatim."** Adopt its cheap, high-leverage *patterns* (AI permissions + draft→approve→publish, events, audit, DDD-as-modules). Defer its heavy *infrastructure* (Prisma/RLS, ClickHouse, pgvector-at-scale, Meili/Typesense, plugin marketplace, Vault) until a real scale or compliance trigger exists — adopting it wholesale would contradict the Handbook's own stated philosophy of *cost-efficiency, freemium, simplicity*.

The platform is **ahead of the Handbook on commerce/logistics** (checkout, PayMongo, COD, Lalamove, wallet, push/SMS) and **behind it on AI-architecture and template scale**.

---

## 2. Reality check — the Handbook assumes a stack we don't have

Verified against `package.json` files and `packages/db/src/schema/index.ts` on 2026-07-12:

| Handbook v1.2 specifies | Actually in repo | Gap |
|---|---|---|
| Prisma + RLS, read replicas | **Drizzle** 0.38, app-level `tenantId` scoping | Full ORM + isolation-model rewrite |
| LangGraph + LangChain.js | Custom `packages/ai` router + cron agents | No graph orchestration |
| Inngest + Redis Streams event bus | Direct API/webhook handlers + Vercel cron | No event bus, no `packages/events` |
| ClickHouse analytics, pgvector memory | Neon Postgres only | Not started |
| Meili/Typesense search | none | Not started |
| 100+ templates, AI auto-personalizes | **14** live renderers; 100 *catalogued* only | Scale + onboarding-flow gap |
| Unified AI Workstation (diff/approve) | Split **Shop Builder / AI Studio / Agents** | No unified draft→approve UI |
| Plans FREE / PRO / ADVANCE | **free / growth / pro** (+ platform `starter`) | Naming + 3–4 conflicting catalogs |

---

## 3. Component verdicts

Legend: ✅ Adopt · 🟡 Adapt (scoped) · ⏸ Defer · ⛔ Reject-for-now

| Handbook section | Verdict | Rationale |
|---|---|---|
| **§5 AI permission scopes + draft→approve→publish** | ✅ **Adopt first** | The crown jewel. For "AI publishes your store," a diff/approve/rollback safety layer is core, not optional. Builds on existing `content_queue` + `platform_audit_log` patterns. See `CROWN-JEWEL-AI-APPROVAL.md`. |
| **§3 Event-driven (Inngest)** | ✅ **Adopt thin** | High value for order/payment/AI side-effects + audit. Start with 3 events, not 11. |
| **§4 DDD bounded contexts** | ✅ **Adopt as modules** | Free win as folder/interface boundaries + docs. Do **not** turn into services. |
| **§10 Audit / compliance** | ✅ **Extend** | `platform_audit_log` exists; extend coverage to tenant-scoped AI/user actions using the same column shape. |
| **§2.2 Cost-efficiency principles** | ✅ **Already doing it** | Tiered LLM, quotas, mock fallbacks, per-tenant usage exist (`plan-limits.ts`, `ai_usage_monthly`). Keep. |
| **§9 Media pipeline** | 🟡 **Partial** | Sharp/WebP optimization is a cheap win; virus-scan / video / AI alt-text defer. |
| **§6 Memory (multi-tier, pgvector)** | 🟡 **Defer heavy parts** | Redis short-term + structured tenant memory now; pgvector only when template-suggest needs it. |
| **LangGraph orchestration** | 🟡 **Adapt, scoped** | Introduce **only** for the customization → draft workflow. Keep the working custom router for simple generation. |
| **§8 Search (Meili/Typesense/vector)** | ⏸ **Defer** | Postgres FTS is the correct MVP step (the Handbook agrees). |
| **§7 Plugin marketplace** | ⏸ **Defer** | Premature; internal provider registry only. |
| **§6/§2 pgvector-at-scale, ClickHouse** | ⏸ **Defer** | No scale trigger; Neon Postgres is sufficient. |
| **§10 Vault (Doppler/Infisical)** | ⏸ **Defer** | Env-var + platform secrets fine at this stage. |
| **Prisma + RLS migration** | ⛔ **Reject-for-now** | Large migration for defense-in-depth we already approximate via app-level scoping. Revisit only if a compliance requirement mandates DB-enforced isolation. |

---

## 4. Critique of the Handbook itself

**Strengths.** The AI-permission/approval model and event-driven auditability are exactly right for an AI-publishing commerce product — the difference between a demo and something a merchant trusts with a live store. The cost-efficiency section is excellent and already partly realized.

**Weaknesses / risks.**
1. **Philosophy vs content contradiction.** It repeatedly says "modular monolith, simplicity, cost-efficiency," then specifies ClickHouse, pgvector, Meili, Vault, a plugin marketplace, and a Prisma/RLS rewrite. Adopted verbatim it *raises* cost and complexity — the opposite of the freemium thesis.
2. **"Approved for Development" is a governance trap.** A spec the team has already decided to only half-implement should not carry a blanket approval; it invites a future contributor to start a Prisma migration "because the Handbook says so." Re-label as **"Target architecture — adopt per ADR-0001."**
3. **Internal spec inconsistencies.** Event names mix conventions — `Order.Created.V1` / `Order.PaymentSucceeded.V1` vs bare `StoreCreated.V1` / `ProductCreated.V1` / `PaymentSucceeded.V1`. Standardize on `Domain.Event.Vn` (see ADR-0001 D2). Plan names FREE/PRO/ADVANCE silently conflict with shipped `free/growth/pro`.
4. **It ignores what's already built.** A v1.3 should invert the framing: start from the current Drizzle / custom-AI / PayMongo reality and describe deltas, not a greenfield enterprise system the repo will never match.

---

## 5. Strategic flag — Guma Commerce vs "Guma OS"

There is a parallel initiative — **"Guma OS," an autonomous AI Business OS** — with its own approved handbook, a separate `guma-os/` monorepo, and a **Redis-Streams OS bus**. Handbook v1.2 here independently proposes **Inngest + Redis Streams** as *Guma Commerce's* event bus. That risks **two event buses and two "constitutions"** over overlapping ground. Note also that this Handbook's DDD §4 already assumes **BayanGo** (the portfolio ride-hailing/delivery app) as a Shipping provider.

**Action:** before investing in either event architecture, confirm **which document is the source of truth and where Guma Commerce ends and Guma OS begins.** Tracked in ADR-0001 D8.

---

## 6. Sequencing (sharpens handoff §16)

Re-ordered by *risk vs. glamour* — unglamorous blockers first:

1. **Fix real bugs before Handbook features.** Unify the **3–4 conflicting plan catalogs** into one source of truth (ADR-0001 D4); **reconcile Drizzle migrations vs live Neon**; enforce **suspended tenant/user** on login + storefront. None of this is in the Handbook, but it outranks all of it.
2. **Crown jewel** — AI permission scopes + draft→approve→publish + audit, plus a thin `packages/events` (3 events) and `tenants.themeDraftJson` / `customizationVersion`. See `CROWN-JEWEL-AI-APPROVAL.md`.
3. **Then** unified Workstation + template-pick-in-onboarding + scoped LangGraph.
4. **Defer** all infra-heavy items behind explicit scale/compliance triggers.

---

*End — see ADR-0001 for the binding decisions and conventions, and CROWN-JEWEL-AI-APPROVAL.md for the implementation blueprint.*
