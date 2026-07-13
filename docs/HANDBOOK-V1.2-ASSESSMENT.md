# Handbook v1.2 — Assessment & Adoption Map

**Date:** 2026-07-12 (amended **2026-07-13**)  
**Status:** Reference (companion to `COMPREHENSIVE-HANDOFF-2026-07-12.md` §2)  
**Related:** `ADR-0001-handbook-adoption.md` (binding decisions), `CROWN-JEWEL-AI-APPROVAL.md` (implementation), `SPRINT-*-PROGRESS.md`

> Purpose: give any developer or coding agent (Cursor, Claude, etc.) a single, grounded view of **which parts of "Guma AI Commerce Implementation Handbook v1.2" to adopt, adapt, defer, or reject** — so contributions stay uniform and nobody "follows the Handbook" into an unnecessary rewrite.

---

## 1. Bottom line

Handbook v1.2 is a strong **enterprise blueprint**, but it describes a heavier and partly different system than the one in this repo. It is stamped "Approved for Development"; **do not read that as "implement verbatim."** Adopt its cheap, high-leverage *patterns* (AI permissions + draft→approve→publish, events, audit, DDD-as-modules). Defer its heavy *infrastructure* (Prisma/RLS, ClickHouse, pgvector-at-scale, Meili/Typesense, plugin marketplace, Vault) until a real scale or compliance trigger exists — adopting it wholesale would contradict the Handbook's own stated philosophy of *cost-efficiency, freemium, simplicity*.

**As of 2026-07-13:** Crown-jewel CR rails cover theme/catalog/pricing/SEO/checkout/shipping; plan catalog is unified (`@guma-commerce/plans`); priority Free Bundle ports (aircon/carserv/motto/studio) are live. Remaining gaps are Workstation UX convergence, migration reconcile, suspension enforcement, and demand-driven template scale — not a stack rewrite.

The platform remains **ahead of the Handbook on commerce/logistics** and **closer on AI-architecture** than at the 2026-07-12 assessment; template scale is **18 live ports** vs 100+ marketed.

---

## 2. Reality check — the Handbook assumes a stack we don't have

Verified against `package.json` files and `packages/db/src/schema/index.ts` (amended 2026-07-13):

| Handbook v1.2 specifies | Actually in repo | Gap |
|---|---|---|
| Prisma + RLS, read replicas | **Drizzle** 0.38, app-level `tenantId` scoping | Full ORM + isolation-model rewrite — **reject-for-now** (ADR D1) |
| LangGraph + LangChain.js | Custom `packages/ai` router + cron agents | No graph orchestration — deferred |
| Inngest + Redis Streams event bus | **`packages/events`** thin Inngest emitters for landed domains | Expand handlers incrementally; no Redis Streams (ADR D2/D8) |
| ClickHouse analytics, pgvector memory | Neon Postgres only | Deferred (ADR D6) |
| Meili/Typesense search | none | Deferred — Postgres FTS first |
| 100+ templates, AI auto-personalizes | **18** live React ports; 100 *catalogued*; priority queue **ported** | Scale ongoing; Launch Top 3 scoring exists |
| Unified AI Workstation (diff/approve) | **Approvals** + Workspace modules; Shop Builder / Agents still separate entry points | Converge UX — not greenfield |
| Plans FREE / PRO / ADVANCE | **IDs** `free`/`growth`/`pro`; **labels** Free/Pro/Advance via `@guma-commerce/plans` | **Resolved** (ADR D4 / Sprint 4) |

---

## 3. Component verdicts

Legend: ✅ Adopt · 🟡 Adapt (scoped) · ⏸ Defer · ⛔ Reject-for-now · ✔ Landed (pattern adopted)

| Handbook section | Verdict | Rationale |
|---|---|---|
| **§5 AI permission scopes + draft→approve→publish** | ✔ **Landed (Phases 1–4 breadth)** | `change_requests` + `SCOPE_MATRIX` + Approvals + events for theme/catalog/pricing/seo/checkout/shipping. See `CROWN-JEWEL-AI-APPROVAL.md`. |
| **§3 Event-driven (Inngest)** | ✔ **Thin landed** | `packages/events` + Domain.Event.Vn for landed domains. Grow handlers; do not invent a second bus. |
| **§4 DDD bounded contexts** | ✅ **Adopt as modules** | Folder/interface boundaries + docs. Do **not** turn into services. |
| **§10 Audit / compliance** | ✔ **Extended** | `platform_audit_log` shape reused for AI/seller publish actions. |
| **§2.2 Cost-efficiency principles** | ✔ **Canonicalized** | Quotas/models in `@guma-commerce/plans` (`PLAN_AI_LIMITS`); soft budget degrade. |
| **Plan naming FREE/PRO/ADVANCE** | ✔ **Mapped** | FREE→`free`, PRO→`growth`, ADVANCE→`pro`; UI labels Free/Pro/Advance. |
| **§9 Media pipeline** | 🟡 **Partial** | Sharp/WebP optimization is a cheap win; virus-scan / video / AI alt-text defer. |
| **§6 Memory (multi-tier, pgvector)** | 🟡 **Defer heavy parts** | Redis short-term + structured tenant memory now; pgvector only when template-suggest needs it. |
| **LangGraph orchestration** | 🟡 **Adapt, scoped** | Introduce **only** if customization → draft workflow needs a graph. Keep the working custom router. |
| **§8 Search (Meili/Typesense/vector)** | ⏸ **Defer** | Postgres FTS is the correct MVP step. |
| **§7 Plugin marketplace** | ⏸ **Defer** | Premature; internal provider registry only. |
| **§6/§2 pgvector-at-scale, ClickHouse** | ⏸ **Defer** | No scale trigger; Neon Postgres is sufficient. |
| **§10 Vault (Doppler/Infisical)** | ⏸ **Defer** | Env-var + platform secrets fine at this stage. |
| **Prisma + RLS migration** | ⛔ **Reject-for-now** | Large migration for defense-in-depth we already approximate via app-level scoping. |

---

## 4. Critique of the Handbook itself

**Strengths.** The AI-permission/approval model and event-driven auditability are exactly right for an AI-publishing commerce product — the difference between a demo and something a merchant trusts with a live store. The cost-efficiency section is excellent and largely realized.

**Weaknesses / risks.**
1. **Philosophy vs content contradiction.** It repeatedly says "modular monolith, simplicity, cost-efficiency," then specifies ClickHouse, pgvector, Meili, Vault, a plugin marketplace, and a Prisma/RLS rewrite. Adopted verbatim it *raises* cost and complexity — the opposite of the freemium thesis.
2. **"Approved for Development" is a governance trap.** A spec the team has already decided to only half-implement should not carry a blanket approval; it invites a future contributor to start a Prisma migration "because the Handbook says so." Re-label as **"Target architecture — adopt per ADR-0001."**
3. **Internal spec inconsistencies.** Event names mix conventions — standardize on `Domain.Event.Vn` (ADR-0001 D2). Plan names FREE/PRO/ADVANCE conflicted with shipped IDs — **resolved via mapping**, not renaming DB IDs.
4. **It ignores what's already built.** A v1.3 should invert the framing: start from the current Drizzle / custom-AI / PayMongo / CR-rails reality and describe deltas.

---

## 5. Strategic flag — Guma Commerce vs "Guma OS"

There is a parallel initiative — **"Guma OS," an autonomous AI Business OS** — with its own approved handbook, a separate `guma-os/` monorepo, and a **Redis-Streams OS bus**. Handbook v1.2 here independently proposes **Inngest + Redis Streams** as *Guma Commerce's* event bus. That risks **two event buses and two "constitutions"** over overlapping ground.

**Action:** before investing in either event architecture beyond commerce side-effects, confirm **which document is the source of truth and where Guma Commerce ends and Guma OS begins.** Tracked in ADR-0001 D8. Until resolved, `packages/events` stays **commerce-scoped**.

---

## 6. Sequencing (amended 2026-07-13)

### Done (Sprints / crown jewel)

1. ✔ Unify plan catalog — ADR D4 / `@guma-commerce/plans` (Sprint 4)
2. ✔ Crown jewel Phases 1–3 + Phase 4 domains (theme, catalog, pricing, SEO, checkout, shipping)
3. ✔ Thin `packages/events` for landed domains
4. ✔ Priority template ports — aircon → carserv → motto → studio (Sprint 5)

### Still next (risk vs glamour)

1. **Foundation leftovers** — reconcile Drizzle migrations vs Neon; enforce suspended tenant/user on login + storefront.
2. **Workstation convergence** — one preview/diff surface over Shop Builder + Workspace Approvals (not a parallel draft system).
3. **Template scale** — further Free Bundle ports as demand; Postgres FTS before Meili.
4. **Defer** all infra-heavy items behind explicit scale/compliance triggers (ADR D6).

---

## 7. Amendment log

| Date | Change |
|------|--------|
| 2026-07-12 | Initial assessment |
| 2026-07-13 | Mark D4 / crown-jewel Phase 4 / priority ports landed; refresh reality-check table and sequencing |

---

*End — see ADR-0001 for binding decisions, CROWN-JEWEL-AI-APPROVAL.md for the blueprint, COMPREHENSIVE-HANDOFF for the live system snapshot.*
