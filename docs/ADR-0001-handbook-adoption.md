# ADR-0001 — Handbook v1.2 Adoption & Shared Conventions

**Status:** Accepted
**Date:** 2026-07-12
**Deciders:** Architecture / product
**Context docs:** `HANDBOOK-V1.2-ASSESSMENT.md`, `COMPREHENSIVE-HANDOFF-2026-07-12.md`

> This ADR is **binding for all contributors, human or AI (Cursor, Claude, etc.).** Its purpose is to prevent divergent implementations of the same concept. If a change conflicts with a decision here, update this ADR first (with rationale) — do not silently deviate.

---

## Decisions

### D1 — Keep Drizzle; do not migrate to Prisma or RLS (now)
App-level `tenantId` scoping via `packages/db` remains the tenancy model. Handbook's Prisma + Postgres RLS is **deferred**, not adopted. Revisit only if a signed compliance requirement mandates DB-enforced isolation. **Do not** introduce Prisma, `drizzle-kit push` against live Neon, or RLS policies without a new ADR.

### D2 — Event bus: Inngest, adopted incrementally, one naming convention
- Transport: **Inngest** (Redis Streams only if a high-volume internal need appears).
- New package: `packages/events` (thin: event schemas + `inngest` client + typed `emit`).
- **Naming convention (canonical):** `Domain.Event.Vn` — PascalCase domain and event, integer version.
  - ✅ `Order.PaymentSucceeded.V1`, `Theme.ChangeApproved.V1`, `Tenant.Created.V1`
  - ⛔ `StoreCreated.V1`, `ProductCreated.V1` (Handbook's bare form — **do not use**)
- Every handler: **idempotency key** + **correlationId/causationId** in the payload.
- First three events only (do not build all 11 at once): `Order.PaymentSucceeded.V1`, `Theme.ChangeApproved.V1`, `Theme.Published.V1`.

### D3 — DDD bounded contexts = module boundaries, not services
Adopt the Handbook's contexts as **folder/interface boundaries and documentation** inside the monolith. Cross-context communication prefers events (D2) or a package's public API — never reaching into another context's tables directly from a UI route. **Do not** split into microservices.

### D4 — One plan catalog, one source of truth
- Canonical plan ids: **`free` · `growth` · `pro`** (stable forever in DB / billing). Platform legacy rows may still store `starter`; normalize via `normalizePlanId`.
- Handbook mapping (use everywhere the Handbook names appear): **FREE → `free`, PRO → `growth`, ADVANCE → `pro`.**
- Constitution / seller-facing labels: **Free · Pro · Advance** (not Sulit / Growth / Pro).
- **Single module:** `@guma-commerce/plans` (`packages/plans`) — prices, features, AI limits, aliases. Thin re-exports remain on `@guma-commerce/db` (`plans`) and `@guma-commerce/ai` (`plan-limits`) for compat. No feature may hardcode plan prices/limits elsewhere.
- Aliases: `starter`→`growth`, `advance`→`pro`, `sulit`→`free`.
- This is **prerequisite work** — it blocks correct billing/MRR (handoff §15, High severity).

**Amendment 2026-07-13:** Sprint 4 landed `@guma-commerce/plans` as the canonical catalog. Do not invent Free/Starter/Growth/Pro as DB IDs.

### D5 — Crown jewel first: AI permissions + draft→approve→publish + audit
This is the top Handbook feature to implement, and it must **reuse existing patterns** for uniformity:
- Mirror the **`content_queue`** draft→moderate pattern (status enum, `flagged`, `moderatedBy`, `moderatedAt`) for all AI-proposed changes.
- Reuse the **`platform_audit_log`** column shape for the AI/seller audit trail (see D7).
- Permission scopes + approval levels live in a **code matrix** (like `plan-limits.ts`), tenant-overridable later.
- Full blueprint: `CROWN-JEWEL-AI-APPROVAL.md`. **Do not** invent parallel tables/enums for "drafts" or "audit" — extend the established ones.

### D6 — Defer heavy infrastructure behind explicit triggers
Deferred until a named trigger fires:
| Item | Adopt only when |
|---|---|
| ClickHouse | Postgres analytics queries exceed acceptable latency at real volume |
| Meili/Typesense | Postgres FTS proves insufficient for product search |
| pgvector-at-scale | Template/semantic suggest is actually being built |
| Plugin marketplace | An internal provider registry exists and 3rd-party demand is real |
| Vault (Doppler/Infisical) | Secret count/rotation outgrows env + platform secrets |
Until then, **do not add these dependencies.** Postgres FTS is the sanctioned MVP search step.

### D7 — Uniform audit shape
All audit entries (platform, seller, AI) share the `platform_audit_log` column vocabulary: `actorId`, `actorEmail`, `action`, `entityType`, `entityId`, `entityLabel`, `metadataJson`, `createdAt`. Tenant-scoped entries add `tenantId` and an `actorType` (`user` | `ai` | `system`). Prefer **extending** the existing table (add `tenantId`, `actorType`) over a second audit table, unless retention/volume forces a split.

### D8 — Resolve the Guma Commerce ↔ Guma OS boundary before dual event buses
There is a parallel "Guma OS" initiative with its own Redis-Streams bus and constitution. **Before** `packages/events` grows beyond commerce side-effects, confirm the source-of-truth and the seam between the two systems (owner decision, not an implementation detail). Until resolved, `packages/events` stays **commerce-scoped** and does not attempt to be the org-wide bus.

---

## Non-goals (explicit "do not do")
- ⛔ Prisma / RLS migration (D1)
- ⛔ Microservice split (D3)
- ⛔ New "draft" or "audit" tables that duplicate `content_queue` / `platform_audit_log` (D5, D7)
- ⛔ ClickHouse, Meili/Typesense, Vault, plugin marketplace, pgvector — as dependencies right now (D6)
- ⛔ Hardcoding plan prices/limits outside the single catalog (D4)
- ⛔ Bare event names without `Domain.Event.Vn` (D2)

---

## Consequences
- Contributions converge on shared tables, one plan catalog, and one event convention → less drift, easier review.
- The Handbook remains a **target**, filtered through these decisions; `HANDBOOK-V1.2-ASSESSMENT.md` records the per-section verdicts.
- Revisions require editing this ADR (append a dated amendment), keeping a single audit trail of architectural intent.
