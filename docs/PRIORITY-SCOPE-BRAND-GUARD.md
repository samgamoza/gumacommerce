# Priority Scope — Brand Guard (Anti-AI-Slop)

**Status:** Next priority (queued after Sprints 1–5)  
**Date:** 2026-08-05  
**Product name (seller-facing):** Brand Guard  
**Inspiration:** [killaislop.com](https://killaislop.com) / [yetone/kill-ai-slop](https://github.com/yetone/kill-ai-slop) taxonomy  
**Binding constraints:** ADR-0001 (keep Launch zero-LLM; reuse `change_requests`; no new agent runtime per shop)

> This is the **next product/engineering priority scope** for storefront quality. Do not implement a merchant-facing “run kill-ai-slop coding agent” step. Adopt the catalogue as Guma rules + optional paid polish.

---

## 1. Decision summary

| Question | Decision |
|----------|----------|
| Integrate the yetone **agent skill** into Launch? | **No** — skill is for coding assistants scanning source trees, not tenant `theme_*_json` |
| Use the **taxonomy / scanner ideas**? | **Yes** — prevention in Launch + templates; remediation in paid Workspace |
| Cost on Free / Launch day-one? | **Near $0** — deterministic rules + CI scan; no new LLM calls on Launch |
| Gate remediation behind paid plan? | **Yes** — Growth+ (`growth` / `pro`) “Polish” via existing AI quotas + CR rails |
| Product framing | Sell **Guma Brand Guard**, not “we run yetone’s agent on your shop” |

---

## 2. Why this fits Guma

Launch is intentionally **zero LLM**:

```
DNA → deterministic Top-3 templates → personalize tokens → CR publish → activate
```

Merchants customize published pattern renderers via theme JSON — they do not receive a freeform React app per shop. kill-ai-slop expects to grep/edit HTML/CSS/TSX/Markdown in a repo. That maps to **our template ports**, not runtime tenancy.

AI slop risk in Guma shows up where we already spend tokens: Workspace marketing, SEO suggest, product generate, campaign copy — not Launch itself.

---

## 3. Non-goals (explicit)

- Do **not** spawn Cursor/Claude coding agents per merchant signup or publish.
- Do **not** add a killaislop.com SaaS dependency or vendor API.
- Do **not** strip intentional PH brand choices (e.g. curated “ube” palettes, vibe emoji in DNA UI) without a whitelist.
- Do **not** invent a parallel approval engine — polish suggestions go through `change_requests`.
- Do **not** block Free Launch behind any LLM call.

---

## 4. Delivery slices (ordered)

### Slice A — Internal / CI (do first, Free forever)

**Owner:** engineering · **Cost:** CI CPU + reviewer time · **Plan gate:** none

1. Install / vendor reference: keep a short pointer in docs; optionally pin `skill/scripts/scan.mjs` patterns under `packages/storefront-themes` or `scripts/` (dependency-free Node).
2. Run scanner (or Guma-adapted rules) against:
   - `apps/web/components/storefront/**` (React ports)
   - **Exclude** raw `reference/**` HTML dumps (high false-positive noise)
3. Add smoke script / CI job: fail or warn on P0 tells (indigo→violet gradient defaults, glass+glow card stacks, Inter-as-only-font on new ports).
4. Template port playbook: require Brand Guard checklist before marking a Free Bundle entry `integrated`.

**DoD**

- [x] Documented scan command in this file + `packages/storefront-templates/README.md`
- [x] At least one CI or `pnpm` script that reports hits on storefront renderers
- [x] Port checklist updated

**Scan command**

```powershell
pnpm brand-guard:scan
# or: node scripts/brand-guard-scan.mjs
```

CI: `.github/workflows/brand-guard.yml` — fails on P0 tells, warns on P1.

### Slice B — Prevention in Launch + brand-kit (Free)

**Owner:** product + themes · **Cost:** $0 runtime · **Plan gate:** none

1. Encode anti-slop constraints in `packages/storefront-themes` (brand-kit / palettes / copy limits):
   - Prefer solid accents over indigo→violet / purple-glass defaults for **new** default picks
   - Cap personalize copy length (already partially Zod-limited); reject or warn on known AI copy tropes (“not just X — it’s Y”, invented “10k+ / 99.9% / 24/7” stats in taglines)
   - Keep existing intentional palettes via explicit allowlist IDs
2. Launch personalize UI: soft inline hints when merchant paste looks like slop (no LLM).
3. Align with existing Cursor frontend design rules (same taxonomy family) so agent-built ports stay consistent.

**DoD**

- [x] Deterministic validators callable from Launch API (`personalize`) and unit-tested
- [x] False-positive allowlist for curated `BRAND_PALETTES` / vibes
- [x] Launch remains zero-LLM (no new provider calls)

Validators live in `packages/storefront-themes/src/brand-guard.ts` (`validateBrandGuardPersonalize`, `hintBrandGuardCopy`). Wired from `apps/admin/app/api/launch/route.ts` personalize + soft hints in `launch-wizard.tsx`.

```powershell
pnpm --filter @guma-commerce/storefront-themes test
```

### Slice C — Paid Brand Guard “Polish” (Growth+)

**Owner:** Workspace · **Cost:** existing `@guma-commerce/plans` AI quotas · **Plan gate:** `growth` / `pro`

1. Workspace action: **Brand Guard — Polish storefront** (or under Marketing / Approvals).
2. Pipeline:
   - Score published theme JSON + key storefront copy against taxonomy (rules first; LLM only for rewrite suggestions)
   - Emit draft → `change_requests` (theme and/or catalog/SEO domain as appropriate)
   - Merchant approves in `/workspace/approvals` → publish
3. Permission: new scope e.g. `ai.suggest.brand_guard` with `human_review` on all plans that can run it; Free sees upgrade gate only.
4. System prompts in `packages/ai` for generation / campaign / SEO: inject anti-slop principles (one accent, subtract first, specific beats punchy) so fewer sloppy drafts are created.

**DoD**

- [ ] No auto-publish
- [ ] Quota checked via `@guma-commerce/plans` / existing usage tables
- [ ] Approvals diff UI shows Brand Guard proposed changes
- [ ] Free plan: upgrade CTA only (no silent LLM)

---

## 5. Plan & cost matrix

| Surface | Free | Pro (`growth`) | Advance (`pro`) |
|---------|------|----------------|-----------------|
| Launch prevention (Slice B) | Yes | Yes | Yes |
| Template CI scan (Slice A) | Eng-only | Eng-only | Eng-only |
| Polish CR (Slice C) | Upgrade gate | Yes (quota) | Yes (higher quota) |
| Per-shop coding agent | Never | Never | Never |

Runtime cost of Slice C should ride **existing** `generationsPerMonth` / soft token budgets — do not add a separate metered vendor.

---

## 6. Workflow placement

```
[Dev]  Port template → Brand Guard scan (CI) → ship clean pattern
                         ↓
[Free Launch] DNA → template → personalize
              ↑ Slice B rules block / hint slop defaults (no LLM)
                         ↓
[Growth+ Workspace] AI suggest / campaign / SEO
              ↑ anti-slop prompts + optional Brand Guard Polish → CR
                         ↓
[Approvals] merchant reviews diff → publish
```

---

## 7. Taxonomy mapping (starter)

Adopt tells from kill-ai-slop that matter for Guma storefronts; whitelist the rest.

| Tell family | Guma action | Notes |
|-------------|-------------|--------|
| Indigo→violet / purple-on-white defaults | Ban as **default** auto-pick; allowlisted named palettes OK | PH “ube” can stay if explicit |
| Glassmorphism + glow card stacks | Ban in new ports + themed-home defaults | |
| Emoji spam / pill badge spam | Cap in AI copy prompts; DNA vibe emoji UI exempt | |
| Inter / Space Grotesk as sole identity | Ports must use template typography tokens | |
| “Not just X — it’s Y” / fake stats | Copy lint on personalize + AI prompts | |
| Nested cards / oversized shadows | Port checklist + scanner | |
| Gradient-clip headlines | Prefer solid ink + scale | |

Full catalogue: upstream `skill/references/taxonomy.md`. Do not copy the entire skill into merchant runtime.

---

## 8. Out of scope for this priority (still open elsewhere)

Production fail-closed mocks, migration journal reconcile, checkout/webhook tests, Inngest consumer fill-out, password reset, custom domains — tracked in codebase review / handoff roadmap. Brand Guard does **not** block those; it is the next **storefront-creation quality** priority.

---

## 9. References

- Upstream: https://github.com/yetone/kill-ai-slop · https://killaislop.com  
- Install (dev agents only): `npx skills add yetone/kill-ai-slop`  
- Guma: `docs/ARCHITECTURE.md` (Launch + Workspace), `docs/ADR-0001-handbook-adoption.md`, `docs/CROWN-JEWEL-AI-APPROVAL.md`  
- Brand kit: `packages/storefront-themes/src/brand-kit.ts`  
- Launch API: `apps/admin/app/api/launch/route.ts`  
- AI quotas: `packages/plans/src/ai-limits.ts`

---

## 10. Suggested implementation order for the next agent

1. Slice A script + port checklist (smallest diff, immediate quality bar).  
2. Slice B validators on Launch `personalize` + unit tests.  
3. Slice C permission + Workspace polish → `change_requests` (only after A/B).
