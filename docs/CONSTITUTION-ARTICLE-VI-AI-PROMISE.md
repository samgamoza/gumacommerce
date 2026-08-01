# GUMA Constitution — Article VI: The AI Promise

**Status:** Ratified companion to `docs/CONSTITUTION.md`
**Date:** 2026-07-20
**Authority:** Binding. This Article defines the boundary between what AI may do and what only a human may decide. Where code and this Article disagree, one of them is wrong — and we fix it.

> _Commerce should never be the hardest part of running a business._

---

## Preamble

Trust is the product. A merchant will hand GUMA their storefront, their prices, their customers, and their money only if they believe one thing without having to think about it: **the AI works for them, and they are always the one who decides.**

This Article is our promise about that. It is deliberately concrete. It does not say "AI is safe" — it says *exactly* what AI may touch on its own, what it may only propose, and what it may never do at all. Every one of these statements is enforced in code today and is traceable to the files named at the end. If we ever want to change the promise, we change this Article first — in the open — and the code follows. Never the reverse.

**AI serves. Humans decide. Merchants own.**

---

## §6.1 — The three levels of authority

Every action AI can take is assigned one of three approval levels. Deny by default: an action with no assigned level cannot run.

| Level | Plain meaning | Who releases it to the world |
|-------|---------------|------------------------------|
| **Automatic** | AI may apply the change itself. It is still recorded and still reversible. | AI (logged, undoable) |
| **Human review** | AI may only *prepare a draft*. Nothing goes live until a human approves and publishes it. | The merchant |
| **Admin only** | Neither AI nor the merchant may do this unattended. It requires a GUMA platform administrator. | A GUMA admin |

These are not aspirations. They are the enum `ApprovalLevel = "automatic" | "human_review" | "admin_only"` in `packages/ai/src/permissions.ts`, and they gate every proposal at the database boundary.

---

## §6.2 — The Capability Schedule (binding)

This is the authoritative map of what AI is allowed to do, per plan. It mirrors `SCOPE_MATRIX` in code exactly. Plan labels are canonical (Free = `free`, Pro = `growth`, Advance = `pro`).

| AI capability | Free | Pro | Advance | Blast radius |
|---------------|------|-----|---------|--------------|
| Rewrite a product description (copy only) | Human review | **Automatic** | **Automatic** | Low · reversible · non-financial |
| Generate / change a storefront theme | Human review | Human review | Human review | Visible to customers |
| Suggest a price | Human review | Human review | Human review | **Financial** |
| Suggest SEO | Human review | Human review | Human review | Visible to customers |
| Suggest checkout settings | Human review | Human review | Human review | **Financial** |
| Suggest shipping settings | Human review | Human review | Human review | **Financial** |
| Publish the store | Human review | Human review | Human review | Goes live |
| Bulk catalog changes | Admin only | Human review | Human review | Wide, hard to undo by hand |
| **Refund an order (money out)** | **Admin only** | **Admin only** | **Admin only** | **Irreversible money movement** |

**The governing rule this table encodes:** the closer an action is to money, to what customers see, or to changes that are hard to undo, the more human authority is mandatory. Autonomy is earned only by actions that are reversible, non-financial, and fully audited.

---

## §6.3 — What AI will never do on its own

These are hard guarantees, true on **every** plan:

1. **AI will never move money.** Refunds — and any future payout, transfer, or charge action — are `admin_only`. AI cannot issue them, and a merchant cannot trigger them through AI. ( `ai.refund.order` )
2. **AI will never publish a storefront change without a human clicking approve.** Theme, pricing, SEO, checkout, shipping, and store publish are all `human_review` on all plans. AI produces a `draft`; a human promotes it.
3. **AI will never post to a merchant's social channels autonomously.** The content agents generate queue items that are created as `draft` and only leave the queue when a human approves them. No autonomous external posting integration exists in the codebase.
4. **AI will never act unlogged.** Every AI-originated change is written as a `change_request` with `proposed_by_type = 'ai'`, and every publish writes an audit row.
5. **AI will never act unrecoverably on reversible surfaces.** Theme, SEO, checkout, and shipping each keep a `before` snapshot and support one-click rollback.

---

## §6.4 — What AI may do without asking

Exactly one class of action is `automatic`, and only on paid Workspace plans (Pro, Advance):

- **Rewriting the *copy* of a product description.** ( `ai.rewrite.description` )

This is permitted because it satisfies all three autonomy conditions simultaneously: it is **reversible** (the previous copy is retained), **non-financial** (it changes words, never price, stock, or checkout), and **audited** (it is still recorded as a change request). It is a convenience the merchant opts into by choosing a paid plan — not a loosening of the promise. If any one of those three conditions ever stops being true for a capability, that capability may not be `automatic`.

---

## §6.5 — The five guarantees behind the promise

1. **Deny by default.** No approval level assigned → the action cannot run.
2. **Draft first.** AI proposals enter the system as `draft`, never as live state. (`createChangeRequest`, `createContentQueueItem`)
3. **Human publishes.** Every publish path requires a human `actorUserId`, refuses `admin_only` scopes, and cannot be invoked by the AI actor.
4. **Always audited.** Every proposal and every publish writes to the tenant-scoped audit log with the actor's identity and type.
5. **Always reversible where it matters.** Every customer-facing domain keeps a `before` snapshot and a rollback path.

---

## §6.6 — The Constitutional Test

Before any new AI capability ships, it must pass one question:

> **Does this preserve merchant control in proportion to its blast radius?**

Concretely: it must be assigned an approval level in `SCOPE_MATRIX`; anything financial or irreversible must be at least `human_review`, and money-out must be `admin_only`; and it must be draft-first, audited, and — if it changes customer-facing state — reversible. If it cannot meet these, it does not ship as written.

---

## §6.7 — A boundary we name honestly

This Article governs **AI acting on a merchant's store**. GUMA's own growth and outreach systems (prospecting, calling, cold email) are a *different actor* — GUMA reaching toward prospects — and they are **not** governed by `SCOPE_MATRIX`. That is not a loophole; it is a separate regime that deserves its own consent-and-approval discipline. Until that regime is written, no claim in this Article should be read as covering outbound growth automation. Drafting it is open work.

---

## §6.8 — Amendment

The promise is only as trustworthy as its resistance to quiet erosion. Therefore:

- A capability's approval level may be **loosened** (toward `automatic`) only by amending this Article first, with the three-condition test in §6.4 explicitly satisfied and recorded.
- A capability's approval level may always be **tightened** without amendment.
- `ai.refund.order` — and any future money-movement scope — is entrenched at `admin_only` and may not be loosened by amendment at all.

---

## Enforcement traceability

This Article is verifiable, not aspirational. It is enforced here:

- **Approval levels & capability matrix** — `packages/ai/src/permissions.ts` (`ApprovalLevel`, `SCOPE_MATRIX`, `resolveApprovalLevel`)
- **Draft-first proposals, human-gated publish, audit, rollback** — `packages/db/src/queries/change-requests.ts` (`createChangeRequest` → status `draft` unless `automatic`; `approveChangeRequest`; `publish*ChangeRequest` require `actorUserId`; `rollback*ChangeRequest`)
- **Social content is draft-only** — `packages/db/src/queries/agents.ts` (`createContentQueueItem` → status `draft`)
- **Autonomous agent runs create, never publish** — `apps/admin/app/api/cron/agents/route.ts` (`itemsCreated`, no external post)
- **Merchant-facing review surface** — `apps/admin/components/workspace-approvals.tsx`

_If you change any of the above, you are amending the Constitution. Update this Article in the same change._
