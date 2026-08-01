# Constitutional Review — Crown Jewel + Core Rails

**Reviewer:** Claude (architectural review)
**Date:** 2026-07-13
**Authority applied:** GUMA Constitution v2.0 (Articles I–XV) — *supreme*; Handbook v1.2 (`docs/HANDBOOK-V1.2-ASSESSMENT.md`) and `docs/CROWN-JEWEL-AI-APPROVAL.md` as the design contract Cursor implemented against.
**Scope (as agreed):** the constitutionally load-bearing rails only —
- AI draft → approve → publish **change-request** engine
- Event architecture (`packages/events`)
- AI permission scopes (`packages/ai/src/permissions.ts`)
- Tenant isolation + audit (`packages/db`)

Apps `web`/`platform`, the 18 template ports, and the marketing surface are **out of scope** for this pass.

---

## 1. Verdict

**The rails are real, and the single most important constitutional property holds: AI never silently publishes.** Every side-effectful change lands as a reviewable `change_requests` row with `before`/`after` diffs, a rollback path, and an audit entry; autonomous agents produce **drafts only** (`apps/admin/lib/agents/run-agents.ts:31` — *"Generated post — review and edit before publishing"*); and every publish requires an authenticated human session. That satisfies the spine of Articles II, III, and XIII.

**But the implementation weakens three constitutional guarantees it claims to provide.** In order of severity:

1. **Publish is not atomic** despite the design doc asserting it is — so a partial failure can mutate the live store while leaving no audit row and no consistent change-request state (**Article VI — hidden business state; Article XII — auditability**).
2. **The approval gate is a formality, not a gate** — publish auto-approves with the actor as their own reviewer, the service accepts publish straight from `draft`, and `SCOPE_MATRIX` is never re-checked at the enforcement boundary (**Article III, V**).
3. **Events are emitted best-effort from the transport layer, not the domain** — so the event log, declared the "source of truth," can silently diverge from actual state (**Article VI, VII**).

None of these is fatal, and none currently lets AI take an action a human didn't trigger. They are integrity erosions: the system *behaves* correctly on the happy path but cannot *prove* it did, which is precisely what Trust by Design (Article V) forbids. **Recommendation: address H1–H3 before the rails carry pricing/refund scopes or before a second human (staff) role is introduced.**

---

## 2. What strengthens the architecture (keep these)

| # | Strength | Constitutional basis | Evidence |
|---|----------|----------------------|----------|
| S1 | One generic `change_requests` table serves all six domains; mirrors `content_queue` rather than inventing a new shape | XI (simplicity, reuse) | `packages/db/src/schema/index.ts:861` |
| S2 | Tenant isolation is applied on **every** change-request read and write (`eq(...tenantId)`) with no exceptions found | XII | `packages/db/src/queries/change-requests.ts` (all queries) |
| S3 | Events are versioned (`*.V1`), Zod-validated via a discriminated union, and `domain_events` has a unique index on `idempotency_key` | VI (versioned, observable, at-least-once) | `packages/events/src/schemas.ts:292`, `schema/index.ts:904` |
| S4 | Rollback restores `beforeJson` snapshots for theme/SEO/checkout/shipping and bumps `customizationVersion` | IV ("can it be reverted?"), V (reversible) | `change-requests.ts:570,673,777,927` |
| S5 | **AI does not autonomously publish.** Cron/agents generate drafts; publish requires `requireTenantSession()` | II, XIII | `run-agents.ts:31`, `api/change-requests/route.ts:62` |
| S6 | `admin_only` scopes are hard-blocked inside the publish services (throw) | II, XII | `change-requests.ts:291,373,457,531,626,730` |
| S7 | Audit is written on every publish and rollback; no code path updates or deletes audit rows | XII | `writeTenantAudit`, `change-requests.ts:214` |

These are genuine architectural wins and should be treated as the baseline the fixes below must preserve.

---

## 3. Findings

Severity: **HIGH** = weakens a core constitutional guarantee; **MEDIUM** = correctness/trust gap with a real failure mode; **LOW** = latent risk or inconsistency.

### H1 — Publish is not transactional (Article VI, XII)
**Where:** `packages/db/src/queries/change-requests.ts` — every `publish*ChangeRequest` (e.g. theme `278–340`, catalog `360–431`, pricing `444–513`).
**What:** Each publish performs 3–4 independent awaits — mutate live state (`tenants.themeJson` / product / `*_published_json`), update the `change_requests` row to `published`, then `writeTenantAudit()` — with **no `db.transaction()`**. Notably, `orders.ts`, `products.ts`, and `wallet.ts` *do* wrap multi-write operations in `db.transaction`, so the most safety-critical flow in the product is the one place lacking it.
**Failure scenario:** `publishThemeChangeRequest` writes the live `themeJson` (`:300`), `publishThemeDraft` succeeds, then the process dies (or the audit insert throws) before `:323`. Result: the storefront is live-changed, the change request is still `approved`, and **no audit row exists**. The design doc (`CROWN-JEWEL-AI-APPROVAL.md §5`) explicitly promises *"Publish is atomic."* It is not.
**Constitutional breach:** Article VI ("No hidden business state") and Article XII ("auditability, immutable logs"). A business-critical change with no audit record is exactly the state the Constitution says cannot exist.
**Remediation:** Wrap each publish (state write + CR update + audit write) in a single `db.transaction`. Emit the domain event only *after* the transaction commits (see H3), keyed idempotently so a post-commit crash is recoverable on replay.

### H2 — The approval gate is bypassable and self-approving (Article III, V)
**Where:** Service accepts publish from unreviewed states — `change-requests.ts:288` (`status !== "approved" && !== "draft" && !== "pending_review"`), repeated at `:370,:454,:528,:623,:727`. Route auto-approves on publish — `api/change-requests/route.ts:168–175` (and `:198,:232,:262,:291,:326`): `if (existing.status !== "approved") { await approveChangeRequest({ reviewedBy: session.userId, reviewNote: "Approved on publish" }) }`.
**What:** Three compounding problems:
1. A change can be published directly from `draft` — the `pending_review → approved` transition is optional, not enforced.
2. When publish auto-approves, the **proposer and reviewer are the same user**, and the audit records a review (`"Approved on publish"`) that never materially happened.
3. **`SCOPE_MATRIX` / `resolveApprovalLevel` is never consulted in the enforcement path.** The route trusts the `approvalLevel` string frozen onto the row at creation time; the matrix is authoritative only if every creation call site populated it correctly (see M1 for a case where one did not).
**Constitutional breach:** Article III makes *Human Review* and *Approval* distinct lifecycle steps; here they collapse into the publish click. Article V (Trust by Design — "predictable, auditable") is undermined because the audit trail asserts a review that didn't occur. **Mitigating context:** a human still initiates every publish (S5), so this is *not* autonomous AI action — but it is a rubber stamp, and it becomes a real hole the moment (a) a staff/owner role split exists, or (b) `ai.suggest.pricing`/`ai.refund.order` ride these same rails.
**Remediation:** (1) In the services, require `status === "approved"` to publish. (2) Re-derive the required `ApprovalLevel` from `SCOPE_MATRIX` at the enforcement boundary and reject if the stored level is weaker. (3) For AI-proposed changes (`proposedByType === "ai"`), forbid auto-approve-on-publish — require an explicit approve action distinct from publish, and record the true reviewer.

### H3 — Events are emitted post-hoc from the transport layer, not the domain (Article VI, VII)
**Where:** All `emitDomainEvent` calls live in route handlers (`api/change-requests/route.ts:80–445`, `api/launch/route.ts:241–261`), *after* the DB publish returns. The `publish*ChangeRequest` services write audit but **emit no events**. `packages/events/src/emit.ts:64–70` swallows real persistence failures (logs and continues).
**What:** The domain event — declared the source of truth (Article VI, doc §6) — is a best-effort side effect bolted on by whichever route remembers to call it, outside any transaction. Two separate publish entrypoints (the CR route and the Launch route) each hand-roll their own emissions, and they don't agree (Launch emits both `Theme.Published` *and* `Store.Published`; the CR route emits only `Theme.Published`). If the state write commits but the process dies before `emitDomainEvent`, or if `domain_events` persistence fails for a non-duplicate reason, the live store has changed and **no event records it**.
**Constitutional breach:** Article VI (events "immutable, replayable, traceable" and the source of truth — a source of truth cannot be best-effort). Article VII/XI (domain behavior — "a publish is an event" — leaks into transport and is duplicated per call site instead of owned by one service).
**Remediation:** Move emission into the publish service, inside the same transaction boundary as the state write and audit (outbox pattern: insert into `domain_events` transactionally, dispatch to Inngest asynchronously from the outbox). Make `domain_events` persistence failure fail the operation, not get logged and skipped.

### M1 — Permission level hardcodes `plan="free"` (Article V, XII)
**Where:** `apps/admin/app/api/checkout/submit/route.ts:31` and `apps/admin/app/api/seo/submit/route.ts:33`: `resolveApprovalLevel("ai.suggest.checkout"/"ai.suggest.seo", "free")`.
**What:** These two routes compute the approval level against a literal `"free"` instead of the tenant's real plan — unlike the sibling `suggest` routes, which correctly pass `quota.usage.plan` (`checkout/suggest/route.ts:69`, `seo/suggest/route.ts:85`). Today the matrix is `human_review` for these scopes across all plans, so behavior is coincidentally correct — but the permission decision only *looks* plan-aware. The day the matrix differentiates by plan, these paths silently apply the wrong gate.
**Constitutional breach:** Article V (permission-aware) and Article XII (least privilege) — a security decision that is decorative rather than real.
**Remediation:** Resolve the plan once per tenant and pass it through; forbid literal plan arguments to `resolveApprovalLevel` (a lint rule or a required `tenantId`-based resolver would prevent recurrence).

### M2 — `aiGenerationId` linkage is defined but never populated (Article IV)
**Where:** FK exists (`schema/index.ts:874`); `createChangeRequest` accepts it (`change-requests.ts:77`); **no route sets it** (grep for `aiGenerationId` across `apps` returns zero assignments).
**What:** The column meant to tie a change back to the AI generation (prompt, model, tokens) that produced it is dead. The audit/diff can show *what* changed but cannot answer *why the AI proposed it* or *which model/prompt* did.
**Constitutional breach:** Article IV (Explainable AI — "Why? / Confidence level?") cannot be answered from the rail because the link to the reasoning is never stored.
**Remediation:** Populate `aiGenerationId` at CR creation on every AI-originated path (`products/generate`, `*/suggest`), and surface it in the Workstation diff.

### M3 — Explainability is not first-class on the change request (Article IV)
**Where:** `change_requests` columns (`schema/index.ts:861`).
**What:** The row carries `summary` + `beforeJson`/`afterJson` — i.e. *what changed* and *revertible*. Article IV requires six answers: **Why, What changed, Expected impact, Confidence, Alternatives, Revertible.** Four of the six have no home. The pricing proposal even carries a `rationale` (`change-requests.ts:438`) but it is not persisted to the CR or audit in a structured way.
**Constitutional breach:** Article IV — recommendations are, at the schema level, partially "black box."
**Remediation:** Add structured explainability fields (e.g. `rationale`, `expectedImpact`, `confidence`, `alternativesJson`) to `change_requests`, or a typed `explanationJson`. The Workstation should render them; empty confidence/alternatives should be visible as such.

### M4 — Event taxonomy: catalog & pricing have no distinct "Published" event (Article VI)
**Where:** `api/change-requests/route.ts:185–193` (catalog) and `:215–227` (pricing) both emit `*.ChangeApproved.V1` for the *publish/applied* step. Theme/SEO/checkout/shipping each have a distinct `*.Published.V1`.
**What:** For catalog and pricing you cannot distinguish "approved" from "applied to the live store" by replaying the event stream — the same event name covers both. For a system where events are the source of truth, that ambiguity is a replay defect.
**Remediation:** Add `Catalog.Published.V1` / `Pricing.Published.V1` (or a shared `Product.PriceChanged.V1`) and emit them from the publish path, distinct from approval.

### L1 — `causationId` never populated (Article VI)
`baseMeta` defines `causationId` (`schemas.ts:39`) and the doc §6 promises it, but `emit.ts` only ever sets `correlationId`. Cause→effect chains across events cannot be reconstructed. Populate `causationId` from the triggering event/command id.

### L2 — Audit/`domain_events` immutability is convention, not enforced (Article XII)
No code updates or deletes `platform_audit_log` or `domain_events` (good), but nothing at the DB level prevents it — no revoked UPDATE/DELETE grant or trigger. Article XII says logs are *immutable*; today that rests on discipline. Consider a DB-level append-only guard for these two tables.

### L3 — Theme publish double-writes the live column (Article III guardrail)
`publishThemeChangeRequest` writes live `themeJson` directly (`change-requests.ts:300–302`) *and then* calls `publishThemeDraft`. Combined with H2's draft-publish path, an unreviewed draft can reach the live column. `CROWN-JEWEL-AI-APPROVAL.md §9` says: *"Do not apply changes directly to live columns without a change_requests row + audit entry."* There is a row, but the direct live write muddies the draft→publish separation. Publish should go through the draft-promotion path only.

---

## 4. Per-Article scorecard

| Article | Subject | Verdict | Notes |
|--------|---------|---------|-------|
| I | Purpose (amplify, not replace) | ✅ Aligned | AI drafts; humans own outcomes. |
| II | Human-Led Commerce | ✅ Aligned | No autonomous publish (S5); `admin_only` enforced (S6). |
| III | Constitutional Workflow | ⚠️ Weak | Review/approval collapse into publish (H2). |
| IV | Explainable AI | ⚠️ Weak | Diff + revertible present; why/confidence/alternatives absent (M2, M3). |
| V | Trust by Design | ⚠️ Weak | Non-atomic publish + self-approval + decorative permission (H1, H2, M1). |
| VI | Events = source of truth | ❌ At risk | Best-effort, post-hoc, non-transactional emission; swallowed persist failures (H1, H3, M4, L1). |
| VII | Domain Sovereignty | ⚠️ Weak | Publish/emit orchestration lives in routes, duplicated per entrypoint (H3). |
| VIII | Modular Evolution | ✅ Aligned | Modular monolith; Inngest deferred sensibly. |
| IX | AI Memory | ➖ N/A this pass | Not in scope; note `aiGenerationId` gap (M2) blocks future memory linkage. |
| X | Performance | ➖ Not assessed | Out of scope. |
| XI | Simplicity over cleverness | ✅ / ⚠️ | Single CR table is excellent (S1); ~250 lines of branching in the route is the counter-example (H3). |
| XII | Security & Tenant Isolation | ✅ / ⚠️ | Isolation consistent (S2); audit atomicity (H1) and enforced immutability (L2) are the gaps. |
| XIII | AI reduces work, not ownership | ✅ Aligned | Drafts + human publish. |
| XIV | Long-term platform thinking | ✅ Aligned | Generic rails extend to new domains without new tables. |
| XV | The Founder Test | ⚠️ | Passes 1/3/4/5; "strengthen trust" (Q2) is where H1–H3 cost points. |

---

## 5. Prioritized remediation

**Before pricing/refund scopes or a staff role ride these rails:**
1. **H1** — wrap every publish in `db.transaction` (state + CR + audit).
2. **H3** — move event emission into the publish service via a transactional outbox; stop swallowing `domain_events` persist failures.
3. **H2** — require `status === "approved"` to publish; re-check `SCOPE_MATRIX` at the boundary; forbid auto-approve for `proposedByType === "ai"`.

**Next:**
4. **M1** — remove hardcoded `"free"`; resolve the tenant plan.
5. **M2 / M3** — populate `aiGenerationId`; add structured explainability fields.
6. **M4 / L1** — distinct `*.Published` events for catalog/pricing; populate `causationId`.

**Hardening:**
7. **L2** — DB-level append-only guard on audit + `domain_events`.
8. **L3** — publish theme only via the draft-promotion path.

---

## 6. One-line summary for the founder

*The rails hold the line that matters — AI proposes, humans decide — but they can't yet **prove** every change was reviewed, recorded, and evented. Close H1–H3 and the crown jewel goes from "trustworthy in practice" to "trustworthy by design."*

---

### Appendix — note on document versions
The Constitution applied here is the **v2.0 (Articles I–XV)** text provided for this review. Two other constitution artifacts exist in-repo and should be reconciled to avoid drift: `docs/CONSTITUTION.md` (labeled *Adopted 2026-07-12*) and the Handbook’s embedded constitution (`../guma-phase1.2/docs/GUMA_OS_ENGINEERING_HANDBOOK.md`, internally *v1.0*). Recommend stamping a single canonical version number across all three.
