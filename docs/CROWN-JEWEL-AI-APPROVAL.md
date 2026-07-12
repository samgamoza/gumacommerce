# Crown Jewel — AI Permissions + Draft → Approve → Publish + Audit

**Date:** 2026-07-12
**Status:** Implementation blueprint (governed by `ADR-0001-handbook-adoption.md` D5/D7)
**Handbook source:** v1.2 §5 (AI Permission Framework & Approval Workflow), §10 (Audit)

> For the implementing agent (Cursor et al.): this is the **highest-leverage Handbook feature** and the safety backbone of an "AI publishes your store" product. Build it by **extending existing patterns**, not inventing new ones. Every schema/enum/route below is chosen to match what already ships so the result is cohesive.

---

## 1. Goal & principles

When AI (or a seller) proposes a change to a live store — theme, pricing, catalog copy, SEO, checkout, shipping — it must land as a **reviewable draft**, be **approved at the right level**, then **publish atomically** with a **rollback path** and a **full audit trail**.

Principles:
- **Reuse, don't reinvent.** Mirror `content_queue` (draft→moderate) and `platform_audit_log` (audit shape).
- **Deny by default.** No AI scope is auto-applied unless the matrix says so for that plan.
- **Diff-centric.** Every change request carries `before`/`after` so the Workstation can show a diff.
- **Idempotent + evented.** Publish emits `Domain.Event.Vn` events (ADR-0001 D2).

---

## 2. What already exists (reuse these)

| Asset | Path | Reuse for |
|---|---|---|
| `content_queue` (status enum, `flagged`, `moderatedBy`, `moderatedAt`) | `packages/db/src/schema/index.ts:686` | The proven draft→approve→moderate shape to mirror |
| `platform_audit_log` (`actorId/action/entityType/entityId/metadataJson`) | `…schema/index.ts:717` | The canonical audit shape (extend, don't fork — ADR D7) |
| `ai_generations` (`inputPrompt/outputJson/model/tokensUsed`) | `…schema/index.ts:671` | Link an approval back to the AI generation that produced it |
| `plan-limits.ts` (`free/growth/pro` matrix) | `packages/ai/src/plan-limits.ts` | The pattern for the permission-scope matrix |
| `tenants.themeJson` (typed jsonb) | `…schema/index.ts:133` | The *live* theme; drafts go in a new `themeDraftJson` |
| `agent_runs`, `ai_usage_monthly` | `…schema/index.ts:737/772` | Quota/attribution context |

---

## 3. Schema additions (minimal, additive)

### 3.1 `change_requests` — generic AI/seller change proposals
Model on `content_queue`. One table serves all domains (theme, pricing, catalog, seo, checkout, shipping):

```ts
// packages/db/src/schema/index.ts
export const changeRequestDomainEnum = pgEnum("change_request_domain", [
  "theme", "pricing", "catalog", "seo", "checkout", "shipping",
]);
export const changeRequestStatusEnum = pgEnum("change_request_status", [
  "draft", "pending_review", "approved", "rejected", "published", "rolled_back",
]);
export const actorTypeEnum = pgEnum("actor_type", ["user", "ai", "system"]);

export const changeRequests = pgTable("change_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  domain: changeRequestDomainEnum("domain").notNull(),
  status: changeRequestStatusEnum("status").default("draft").notNull(),
  scope: varchar("scope", { length: 60 }).notNull(),        // e.g. "ai.generate.theme"
  approvalLevel: varchar("approval_level", { length: 20 }).notNull(), // automatic|human_review|admin_only
  proposedByType: actorTypeEnum("proposed_by_type").notNull(),
  proposedByUserId: uuid("proposed_by_user_id").references(() => users.id),
  aiGenerationId: uuid("ai_generation_id").references(() => aiGenerations.id),
  summary: varchar("summary", { length: 255 }),
  beforeJson: jsonb("before_json"),   // snapshot for diff + rollback
  afterJson: jsonb("after_json"),     // proposed state
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("change_requests_tenant_idx").on(t.tenantId),
  index("change_requests_status_idx").on(t.status),
]);
```

### 3.2 `tenants` — draft + version columns (handoff Phase A)
```ts
themeDraftJson: jsonb("theme_draft_json").$type<typeof themeJson>(),   // pending theme
customizationVersion: integer("customization_version").default(0).notNull(),
```

### 3.3 Audit — extend `platform_audit_log` (ADR D7, do not fork)
Add `tenantId` (nullable) and `actorType`; reuse for tenant-scoped AI/seller actions. Keep the existing column vocabulary.

> Migration: use `pnpm db:generate` + migrate (never `db:push` on live Neon — handoff §6). Run `pnpm db:reconcile` if drift.

---

## 4. Permission scope matrix (code, like `plan-limits.ts`)

New module `packages/ai/src/permissions.ts`:

```ts
export type AiScope =
  | "ai.suggest.pricing" | "ai.rewrite.description" | "ai.generate.theme"
  | "ai.publish.store" | "ai.bulk.catalog" | "ai.refund.order";
export type ApprovalLevel = "automatic" | "human_review" | "admin_only";

// Deny by default. Level required per scope, tunable per plan.
export const SCOPE_MATRIX: Record<AiScope, Record<SubscriptionPlan, ApprovalLevel>> = {
  "ai.rewrite.description": { free: "human_review", growth: "automatic", pro: "automatic" },
  "ai.generate.theme":      { free: "human_review", growth: "human_review", pro: "human_review" },
  "ai.suggest.pricing":     { free: "human_review", growth: "human_review", pro: "human_review" },
  "ai.publish.store":       { free: "human_review", growth: "human_review", pro: "human_review" },
  "ai.bulk.catalog":        { free: "admin_only",   growth: "human_review", pro: "human_review" },
  "ai.refund.order":        { free: "admin_only",   growth: "admin_only",   pro: "admin_only" },
};
```
Per-tenant overrides later via `tenants.settingsJson.aiPermissions` (do not add a table yet).

---

## 5. Approval state machine

```
draft ──(submit)──► pending_review ──(approve)──► approved ──(publish)──► published
   │                     │                                                   │
   │                     └──(reject)──► rejected                             │
   └──(automatic level: auto-approve)──────────────────────────────────────►┘
published ──(rollback)──► rolled_back   // restores beforeJson, bumps customizationVersion
```

- `approvalLevel = automatic` → skip review, go straight to publish (still audited).
- `human_review` → seller approves in Workstation.
- `admin_only` → super-admin only (platform console).
- **Publish is atomic:** copy `afterJson` → live (`tenants.themeJson` / product fields), clear `themeDraftJson`, `customizationVersion++`, set `publishedAt`, emit event, write audit.
- **Rollback:** re-apply `beforeJson`, new audit entry, emit `*.RolledBack.V1`.

---

## 6. Events (ADR D2 naming)

Emit from the publish/approve service (first three are the ADR's initial set):
- `Theme.ChangeApproved.V1`
- `Theme.Published.V1`
- `Catalog.ChangeApproved.V1` / `Pricing.ChangeApproved.V1` (as domains come online)
- `Theme.RolledBack.V1`

Payload includes `tenantId`, `changeRequestId`, `correlationId`, `causationId`, `customizationVersion`.

---

## 7. Workstation UI (unify the three surfaces)

Today: **Shop Builder** (`apps/admin/app/shop-builder`), **AI Studio** (`/ai-studio`), **Agents** (`/agents`) are separate. Converge on one **AI Workstation** that shows: live preview · AI prompt input · **pending change list** (from `change_requests`) · **diff panel** (`beforeJson` vs `afterJson`) · Approve/Reject/Publish · plan/permission indicator. Reuse the moderation UX already used for `content_queue` in the platform console for consistency.

---

## 8. File touchpoints

| Area | Path |
|---|---|
| Schema + enums + migration | `packages/db/src/schema/index.ts`, `packages/db/migrations/*` |
| Permission matrix | `packages/ai/src/permissions.ts` (new) |
| Change-request service (create/submit/approve/publish/rollback) | `packages/ai/src/change-requests.ts` (new) or `packages/services` |
| Events client | `packages/events/*` (new, thin — ADR D2) |
| Audit helper | reuse/extend `platform_audit_log` writer in `packages/db/src/queries` |
| AI generation link | `ai_generations.appliedToProductId` pattern → set `changeRequests.aiGenerationId` |
| Workstation UI | `apps/admin/app/shop-builder/*`, `/ai-studio/*` → unify |
| Super-admin `admin_only` review | `apps/platform` (mirror `content_queue` moderation) |

---

## 9. Guardrails (do not)
- ⛔ Do **not** create a second "audit" or "drafts" table — extend `platform_audit_log`, mirror `content_queue` (ADR D5/D7).
- ⛔ Do **not** auto-publish any scope whose matrix level is `human_review`/`admin_only`.
- ⛔ Do **not** apply changes directly to live columns without a `change_requests` row + audit entry.
- ⛔ Do **not** `db:push` to live Neon (handoff §6) — generate + migrate.
- ⛔ Do **not** hardcode plan behavior — resolve via the single plan catalog (ADR D4) and `SCOPE_MATRIX`.

---

## 10. Phased delivery & acceptance

**Phase 1 — Rails.** `change_requests` table, `themeDraftJson`/`customizationVersion`, audit extension, `permissions.ts` matrix. *Accept:* a theme edit creates a `draft` row; nothing touches live `themeJson`.

**Phase 2 — Flow.** create→submit→approve→publish service + audit + first two events. *Accept:* approving a request publishes atomically, bumps `customizationVersion`, writes one audit row, emits `Theme.Published.V1`; rollback restores prior state.

**Phase 3 — Workstation.** Unified UI with diff + approve/reject; `admin_only` routes to platform console. *Accept:* a seller sees the AI's proposed diff and approves/rejects; a `free`-plan `ai.bulk.catalog` request is blocked to `admin_only`.

**Phase 4 — Breadth.** Extend domains (pricing, catalog, seo, checkout) reusing the same table/flow. *Accept:* no new tables added; only new `domain`/`scope` values.

---

*Governed by ADR-0001. Rationale in HANDBOOK-V1.2-ASSESSMENT.md. Keep this doc updated as phases land.*
