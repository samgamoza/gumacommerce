# Chief Engineer Directive — Cursor Execution Prompt

**From:** Chief Engineer
**To:** Cursor (coding agent)
**Date:** 2026-08-06
**Repo:** `D:\All Apps\gumacommerce` (`@guma-commerce/*`)
**Read first:** `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md`, `docs/ADR-0001-handbook-adoption.md` — both are binding. If anything below conflicts with ADR-0001, ADR-0001 wins; flag the conflict instead of silently resolving it.

---

## 0. Standing context (do not re-derive, just accept)

- Branch `wip/uncommitted-work-2026-08-01` currently carries **130 uncommitted files** (git status confirmed). Treat the working tree as source of truth, but **Phase 1 below is mandatory before any other phase starts.**
- Three apps: `apps/web` (:3010, marketing + storefront + checkout), `apps/admin` (:3001, seller), `apps/platform` (:3002, super-admin). Shared packages under `packages/*`.
- Hard rules (non-negotiable, from existing docs — do not violate even if it looks convenient):
  1. Never run `db:push` against live Neon. Use migrations (`pnpm db:migrate`).
  2. Never import `@guma-commerce/db` from a `"use client"` component.
  3. Never add silent mock fallbacks in production. Follow the fail-closed pattern already established in `packages/services/src/config/runtime-mode.ts` and `integrations.ts` (`docs/MVP-HARDENING-P1-INTEGRATION-MOCKS.md`) — extend it, don't bypass it.
  4. Do not invent new "draft" or "audit" tables — reuse `content_queue` and `platform_audit_log` shapes (ADR-0001 D5/D7).
  5. Do not hardcode plan prices/limits outside `@guma-commerce/plans` (ADR-0001 D4).
  6. Do not add Prisma, RLS, ClickHouse, Meili/Typesense, Vault, or a plugin marketplace — all explicitly deferred (ADR-0001 D1/D6).
  7. Event names must be `Domain.Event.Vn` PascalCase (ADR-0001 D2) if you touch `packages/events`.
  8. No per-merchant coding agent, no killaislop.com SaaS dependency (`docs/PRIORITY-SCOPE-BRAND-GUARD.md` §3).

## 1. Chief Engineer decisions (settled — do not re-litigate, just build to these)

The review summary's sign-off questions are answered. Build to these defaults:

1. **Logistics story for v1 = manual e-wallet + Book/Assign rider.** Do not block on Lalamove/Grab/PayMongo live keys; keep the credential-gated fail-closed behavior working correctly instead.
2. **`frontend1` is the only live marketing homepage** until `frontend2` copy is rewritten to match shipped reality. Do not add new overclaiming copy to either.
3. **Commit hygiene (Phase 1) blocks everything else**, including any external seller invite.
4. **Helpdesk will be staffed daily** for soft launch — so it needs a notification path (Phase 5) to be operationally real, not just a poll-only queue.
5. **Engineering order:** suspend enforcement (security gap) → commit hygiene is actually first (see Phase order below) → Brand Guard Slice A/B → helpdesk notifications → honest marketing copy pass → observability/tests → Workstation convergence last.

## 2. Operating mode

- **Work in slices that map 1:1 to the phases below.** Each phase = one reviewable, independently mergeable unit. Do not bundle unrelated phases into one commit/PR.
- Before marking any phase done: run the relevant typecheck/test/lint commands (§6) and paste the actual output, not a claim that it passes.
- If a phase requires a product/business decision not covered by §1 (e.g., real Lalamove partner terms), stop and ask — do not guess and ship.
- Do not refactor code outside a phase's stated scope. No drive-by renames, no "while I'm here" cleanups on unrelated files.
- Every new integration touchpoint must go through the existing `assertIntegrationReady` / `getIntegrationReport` pattern in `packages/services/src/config/integrations.ts` — do not write a parallel env-check.
- Prefer extending existing schema/enums (e.g. `TenantStatus`, `content_queue`) over adding new tables.

---

## 3. Phase order and acceptance criteria

### Phase 1 — Commit hygiene (blocks all other phases)

**Goal:** turn the 130-file uncommitted delta into reviewable history before any new feature work lands on top of it.

1. Run `git status --porcelain` and group the changes into logical slices. Suggested grouping based on current diff:
   - `delivery+helpdesk` — `apps/admin/app/api/orders/[orderId]/{book-delivery,assign-rider,confirm-payment}`, `packages/services/src/delivery/**`, `packages/db/src/queries/deliveries.ts`, helpdesk-related admin/platform files.
   - `chat+manual-pay` — `apps/web/app/api/chat/route.ts`, `apps/admin/app/api/messages/**`, `apps/web/app/api/checkout/route.ts`, `apps/web/components/checkout-form.tsx`, `confirm-payment` route.
   - `frontend1-polish` — everything under `apps/web/components/landing/**`, `apps/web/components/storefront/**` theme/CSS edits.
   - `docs` — every `docs/*.md` change, standalone commit.
   - `db/schema` — `packages/db/src/schema/index.ts`, `packages/db/drizzle/meta/_journal.json`, migration files, `tenant-settings.ts`, `tenant-checkout.ts`.
   - `infra/config` — `.env.example`, `.gitignore`, root `package.json`, `pnpm-lock.yaml`, `tsconfig.tsbuildinfo` files (consider whether `.tsbuildinfo` should be gitignored instead of committed — flag this, don't silently decide).
2. For each slice: `git add <files>`, write a commit message describing the *why*, run typecheck for affected packages, commit.
3. Do **not** squash into one commit. Do **not** force-push. Do **not** rewrite already-shared history.
4. Open the branch for review (or note that it's ready) once all slices are committed — do not merge to `main` yourself without explicit sign-off.

**DoD:** `git status --porcelain` is empty (or only contains genuinely new work-in-progress you flag explicitly), history is slice-committed, `pnpm --filter @guma-commerce/{db,web,admin,platform} exec tsc --noEmit` is clean after each commit.

---

### Phase 2 — Suspend enforcement (security gap, ❌ in launch matrix)

**Finding (verified in code, not just the doc):** `TenantStatus` (`packages/db/src/queries/tenant-dashboard.ts`) and `USER_STATUSES`/`TENANT_STATUSES` (`packages/db/src/queries/platform.ts`) include `"suspended"`. Platform login (`apps/platform/app/api/auth/login/route.ts:40`) already blocks suspended **platform** users. But:
- `apps/admin` only *displays* `tenant.status` as a badge (`admin-shell.tsx:82`, `dashboard-view.tsx:148/162`) — it does not block seller login/actions when a tenant is suspended.
- `apps/web` has **zero** references to tenant suspension — a suspended tenant's storefront and checkout stay fully live to buyers.

**Task:**
1. Add a suspension check at the seller auth/session boundary in `apps/admin` (session validation middleware or shared layout data-fetch) that blocks write actions (and ideally the dashboard itself, with a clear "Your shop is suspended — contact support" state) when `tenant.status === "suspended"`. Read-only access to settle final orders may be acceptable — decide and document the choice in the PR description, don't leave it implicit.
2. Add the same check to `apps/web`'s tenant resolution path (`apps/web/lib/model-store-tenant.ts` or wherever the tenant is loaded per request) so a suspended tenant's storefront returns a "shop unavailable" page instead of serving checkout.
3. Checkout API (`apps/web/app/api/checkout/route.ts`) must reject new orders for suspended tenants with a clear error, not a silent 200.
4. Add a unit/integration test for each of the three surfaces (admin, storefront render, checkout API) proving suspended tenants are blocked.
5. Update `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md` §6 (launch readiness matrix) row for "Suspended user/tenant enforcement" from ❌ to ✅ once verified — and only then.

**DoD:** suspended tenant cannot complete checkout, cannot manage products/orders in admin, storefront shows a clear "unavailable" state; tests cover all three; existing active-tenant flows unaffected (run full existing test suite).

---

### Phase 3 — Brand Guard Slice A + B (`docs/PRIORITY-SCOPE-BRAND-GUARD.md`)

Follow the doc's own "suggested implementation order" (§10) — do **not** start Slice C (paid Workspace polish) yet.

**Slice A — CI scanner (Free forever, eng-only):**
1. Add a dependency-free Node script (e.g. `scripts/brand-guard-scan.mjs`) that scans `apps/web/components/storefront/**` (React ports only — exclude `reference/**` raw HTML dumps per the doc) for the P0 tells in §7 of the doc: indigo→violet/purple-glass defaults, glassmorphism+glow card stacks, Inter-as-only-font, "not just X — it's Y" / fabricated stats copy, nested-card/oversized-shadow patterns, gradient-clip headlines.
2. Wire it as a `pnpm` script and a CI job step that warns (P1 tells) or fails (P0 tells) on hits.
3. Document the scan command in `PRIORITY-SCOPE-BRAND-GUARD.md` and `packages/storefront-templates/README.md` (create the README section if it doesn't reference this yet).
4. Update the template-port checklist to require a clean Brand Guard scan before marking a Free Bundle entry `integrated`.

**Slice B — Launch-time prevention (Free, zero-LLM):**
1. Add deterministic validators in `packages/storefront-themes` (brand-kit/palette/copy-length rules) callable from the Launch `personalize` API (`apps/admin/app/api/launch/route.ts`).
2. Cap/reject known AI-copy tropes and fabricated stats in personalize text input; keep existing Zod length limits, add pattern rules on top.
3. Maintain an explicit allowlist for intentional palettes (e.g. curated "ube" palette IDs) so Slice B doesn't strip deliberate PH brand choices.
4. Add soft inline UI hints in the Launch personalize form when input matches a slop pattern — no LLM call, purely client/server-side pattern match.
5. Unit-test the validators directly (not just through the API).

**Explicitly do not:** touch AI system prompts / Workspace polish flow (that's Slice C, out of scope here); do not add a new LLM call anywhere in Launch.

**DoD:** CI job exists and runs on the storefront component tree; Launch personalize rejects/warns on known slop patterns with unit test coverage; allowlist prevents false positives on existing curated palettes; zero new LLM calls introduced.

---

### Phase 4 — Helpdesk notifications

**Finding:** `docs/DELIVERY-AND-HELPDESK.md` describes `support_tickets` / `support_ticket_messages` (migration `0013_support_helpdesk`) with SLA clocks (4h first response / 48h resolve), but per the review summary agents currently only *poll* the platform queue — no email/push on create or reply.

**Task:**
1. Identify the ticket-create and ticket-reply write paths (web `/contact` intake, admin Help & support, platform `/helpdesk` agent console).
2. Add email notification on: (a) new ticket created → notify platform helpdesk queue/agents, (b) agent reply → notify the ticket's buyer/seller contact.
3. Reuse whatever transactional email capability already exists in the repo (check `packages/services` for an existing email/notification client before adding a new provider dependency — do not add a new vendor without checking first).
4. Respect the fail-closed integration pattern (§0.3) — if email isn't configured, log a clear warning and degrade gracefully in dev/test, but do not silently pretend a notification was sent in production.
5. Add a health check entry for the email integration alongside the existing `/api/health/integrations` pattern.

**DoD:** creating a ticket and replying to one both trigger an email in an environment with email configured; missing-config behavior matches the fail-closed policy; covered by at least one integration test.

---

### Phase 5 — Honest marketing pass

1. Audit `frontend2` ("Guma One.ai") copy against §2 ("Not claiming yet") of `docs/CHIEF-ENGINEER-REVIEW-SUMMARY.md`: no claims of full PayMongo settle in all envs, auto-dispatch on payment, Meta Messenger, LangGraph Workstation, 100 live templates, or Angkas/Move It partner APIs unless actually shipped.
2. Confirm `frontend1` stays the default/only live marketing homepage per §1 decision — check routing/env flags controlling which frontend serves the root marketing route.
3. Fix the legal-entity footer placeholder (SEC/TIN) flagged in the launch readiness matrix — either real values from the business owner or an explicit "pending registration" state, not a fake placeholder that reads as real. **Ask for the real values rather than inventing them.**
4. Cross-check any copy referencing Lalamove/GrabExpress/Angkas as "automatic" — must reflect the actual credential-gated + manual-assign reality.

**DoD:** no marketing copy claims a capability that isn't live behind real credentials today; footer legal info is either real or explicitly marked pending, never fabricated.

---

### Phase 6 — Observability & test hardening (lower priority, after 1–5)

1. Confirm Sentry (or equivalent) is wired for all three apps in production, not just optional/local.
2. Expand test coverage flagged as thin in the review (`checkout/webhook tests`, `Inngest consumer fill-out`, `migration journal reconcile` — all called out as open items in `PRIORITY-SCOPE-BRAND-GUARD.md` §8 "out of scope for this priority... tracked elsewhere").
3. Do not attempt full SLO dashboards or a full E2E suite in this pass — scope to the specific gaps named above. If broader observability work is wanted, that's a separate directive.

**DoD:** checkout and delivery/payment webhook paths have integration test coverage; Inngest consumers referenced but unfilled are either implemented or explicitly ticketed (not silently left as stubs without a tracking note).

---

### Phase 7 — Do not start yet

**Workstation convergence** (unified AI Workstation, full LangGraph, Meta Messenger, 100 live templates) is explicitly **out of scope** until launch stability is proven post-Phase 1–6. Do not begin this even if it looks like natural next work — it requires a separate Chief Engineer directive.

---

## 4. Reporting format

For each phase, report back with:
1. Files touched (list, not diff dump).
2. Commands run and their actual output (typecheck/test), not a summary claim.
3. Anything from §2 "stop and ask" that you hit.
4. Explicit note of anything you deliberately left out of scope and why.

## 5. Verification commands

```powershell
cd "D:\All Apps\gumacommerce"
pnpm install
pnpm db:migrate

pnpm --filter @guma-commerce/{db,web,admin,platform} exec tsc --noEmit
pnpm --filter @guma-commerce/services test
pnpm --filter @guma-commerce/plans test

pnpm --filter @guma-commerce/web run dev        # :3010
pnpm --filter @guma-commerce/admin run dev      # :3001
pnpm --filter @guma-commerce/platform run dev   # :3002
```

Manual production-mode integration check (per `docs/MVP-HARDENING-P1-INTEGRATION-MOCKS.md`):
- Unset `PAYMONGO_SECRET_KEY` with `VERCEL_ENV=production` → checkout must 503, never a mock redirect.
- Hit `/api/health/integrations` on web and admin, confirm no secret leakage in the payload.

---

*Issued for execution — Chief Engineer, 2026-08-06.*
