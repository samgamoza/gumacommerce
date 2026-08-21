# Mission 000 — Repository Preservation and Executable Baseline

**Status:** Investigation complete. Checkpoint/commit NOT yet executed — awaiting one further explicit go-ahead (see §6).
**Repository:** `D:\All Apps\gumacommerce`, branch `wip/uncommitted-work-2026-08-01`.
**Date:** 2026-08-20.
**What this pass did:** read-only inventory, classification, and root-cause analysis of the dirty working tree; a read-only secret/generated-file scan; an attempted toolchain run (with its failure modes precisely documented); a read-only migration/journal reconciliation; and direct code verification of the fail-closed integration posture and the active storefront default. **No file was modified, no command was executed against a database (local or live), and nothing was committed, staged, or pushed.**

---

## 1. Headline finding — the "571 modified files" risk is much smaller than it looks

`git status` reports 572 modified files plus the review doc added in the prior pass (573 total). The repo's own Chief Engineer review already flagged this as a "High (ops)" risk. Investigation in this pass found that risk is real but **almost entirely caused by one mechanical, fixable problem, not by 572 files' worth of accumulated real edits**:

```
git diff --shortstat        →  572 files changed, 69272 insertions(+), 69195 deletions(-)
git diff --shortstat -w     →    5 files changed,     92 insertions(+),    15 deletions(-)
```

`-w` (ignore whitespace) collapses the diff from 572 files to 5. Spot-checking individual files (`docs/CONSTITUTION.md`, `docs/ARCHITECTURE.md`) confirmed the pattern directly: every line of the file is reported changed, insertions exactly equal deletions, and the diff disappears entirely under `-w`. That signature means **line-ending conversion (CRLF vs. LF), not content edits**. Root cause, confirmed: `git show HEAD:docs/CONSTITUTION.md | file -` reports plain `UTF-8 text`; the working-tree copy reports `UTF-8 text, with CRLF line terminators`. There is no `.gitattributes` file in the repository and no `core.autocrlf` set — so Windows tooling (the working checkout is at `D:\All Apps\gumacommerce`) has re-saved files with CRLF line endings against LF-committed blobs, and git faithfully reports the entire file as changed on every line.

**The five files with genuine content changes:**

| File | Nature |
|---|---|
| `apps/admin/tsconfig.tsbuildinfo` | TypeScript incremental-build cache — generated, safe to regenerate, should never have been tracked |
| `apps/platform/tsconfig.tsbuildinfo` | Same |
| `apps/web/tsconfig.tsbuildinfo` | Same |
| `docs/AGENT-HANDOFF.md` | Real, substantive addition: +101/-15, a new dated session-narrative section ("2026-08-07 → 2026-08-08 — Platform ops + Template Intel + PayMongo gate") documenting recent work and a soft-launch deploy path (`.\deploy.ps1` → Proxmox CT 106) |
| `simply-sweet-source` (gitlink) | Not a content diff — the embedded repo's own working tree has uncommitted changes, so git reports the gitlink pointer as `<commit>-dirty` (detail in §3) |

**Practical implication:** once the CRLF issue is fixed at the source (see §5), the real uncommitted-work backlog in this repository is one already-fairly-current doc update, three disposable build caches, and one nested repo needing its own decision — not the sprawling 571-file risk the raw file count suggested. This changes the urgency calculus for the rest of Mission 000 considerably, though the CRLF issue is itself worth fixing properly (see §5) since it will keep re-triggering on every Windows save until `.gitattributes` exists.

---

## 2. Secret and generated-file scan — clean

- Only one `.env`-shaped file is tracked anywhere in the repository: `.env.example` (a template with no real values, and its only diff is the same CRLF noise as everything else).
- No `.env`, `.env.local`, `.env.production`, key, credential, or token file is tracked or staged in the parent repository.
- The nested `simply-sweet-source` directory does contain an untracked `.env.local` (43 bytes) — its only key is `VITE_BASE44_APP_ID`, a non-secret application identifier, not an API key or credential. It is not visible to or tracked by the parent repo in any case, since the parent only stores the gitlink's commit pointer (§3).
- A filename-pattern sweep for `secret|credential|.pem|.key|token` across every modified/tracked path returned exactly one match, and it's a false positive: `apps/admin/app/kyc/mobile/[token]/page.tsx` — a Next.js dynamic-route folder name, not a secret file.
- No build output (`.next/`, `dist/`, `build/`, `coverage/`) or `node_modules/` path appears in `git status` — the `.gitignore` is doing its job there.

**One real, minor gap found:** `*.tsbuildinfo` is not in `.gitignore`, which is why the three cache files above show as tracked, modified noise. This is a one-line fix (§5).

---

## 3. `simply-sweet-source` — needs a founder decision, not a code fix

`git ls-files -s simply-sweet-source` shows mode `160000` — a gitlink, the same mechanism Git uses for real submodules — pointing at commit `69abe0239c12768764080f3f58f1f79a76049105`. But no `.gitmodules` file exists anywhere in the repository. That combination means: the parent repo tracks *a pointer* to a specific commit of a nested Git repository, but has never formally declared it as a submodule (no registered URL, no `git submodule` tooling will manage it, no clone-time behavior is defined for a fresh checkout). The nested repo itself has its own `.env.local` and its own `.git`, and currently has uncommitted changes of its own, which is why the parent sees the gitlink as dirty (`<commit>-dirty`) even though the parent's own tracked pointer value hasn't moved.

This is not something to silently fix. Three real options exist and the choice affects how new clones of this repo behave for every future contributor:
1. **Formalize it as a real submodule** — add `.gitmodules` with the nested repo's remote URL, so `git submodule update --init` works on a fresh clone.
2. **Convert it to a subtree or plain vendored copy** — drop the gitlink, commit the nested repo's files directly (loses its independent history unless done carefully).
3. **Remove it from the parent repo's tracking entirely** (`git rm --cached simply-sweet-source`, keep the directory locally, add it to `.gitignore`) — appropriate if it's local-only scratch/reference material never meant to ship with the monorepo.

**No action taken on this — it is listed here as an open founder decision (also carried into the unknowns list of the strategy review, §14).**

---

## 4. Toolchain — could not be executed in this sandbox; two specific, unrelated causes, both environmental

Per the strategy review's §0 caveat, nothing in this repository has been run — only read. This pass attempted to actually run the declared toolchain and is now able to state precisely why it couldn't, rather than only asserting a general limitation:

1. **`corepack enable` fails**: `EACCES: permission denied, symlink '../lib/node_modules/corepack/dist/pnpm.js' -> '/usr/bin/pnpm'`. The sandbox's Node install doesn't allow writing a symlink into its global bin directory. This is a sandbox permissions restriction, unrelated to the repository.
2. **Network egress is blocked**: `corepack prepare pnpm@9.15.0 --activate` and a direct `npm view typescript version` both fail with `403 Forbidden` against `registry.npmjs.org`, and a raw `curl -I` to the same host returns `403 Forbidden`, header `X-Proxy-Error: blocked-by-allowlist`. Package installation is not possible from this sandbox at all, independent of the corepack issue.
3. The existing `node_modules/` in the mounted checkout has broken symlinks (`Input/output error` on `ls -la node_modules/*`) — consistent with a `pnpm` symlink-based install that doesn't survive being read through this particular mount, so even the already-installed dependencies can't be exercised from here.

None of this reflects on the repository's own health — it reflects the sandbox's network allowlist and permission model. **This is the one item in Mission 000's original scope that a real go/no-go decision cannot fully close from within this environment**; running `pnpm install && pnpm --filter ... exec tsc --noEmit` (and the `pnpm test:*` scripts) on the actual Windows development machine, outside this sandbox, is the only way to get a genuine build/lint/typecheck/test signal, and should be treated as still outstanding rather than assumed to pass.

**Partial compensating check performed:** every core JSON config file that could plausibly be hand-edited into a broken state (`package.json`, root `tsconfig.json`, `apps/{web,admin,platform}/package.json`, `packages/db/drizzle/meta/_journal.json`) parses as valid JSON. This is a weak signal — far short of a real build — but it does rule out the most trivial class of corruption.

---

## 5. Migration/journal drift — reconfirmed, and now precisely characterized

Re-verified independently in this pass (not carried over from the prior audit by assumption): 18 migration files exist on disk (`0000` through `0017`), but `packages/db/drizzle/meta/_journal.json` has only 17 entries, with `idx` values `[0, 1, 3, 4, 5, ..., 17]` — **`idx=2` is missing**, even though `0002_nosy_ikaris.sql` is present as a file.

**New in this pass — the actual content of `0002_nosy_ikaris.sql` was read, and it meaningfully de-risks this finding.** Every statement in that migration is written idempotently: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and every `ADD CONSTRAINT` is wrapped in a `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$` block. That means re-running this migration against a database where it has already been applied (via an earlier, untracked `db:push`, matching the pattern the repo's own `packages/db/src/reconcile-migrations.ts` script exists to handle for a different, similarly-shaped drift on migration `0001`) would be a safe no-op, not a destructive re-application. This lowers the risk profile of the gap considerably: it looks like the same class of problem the team has already built tooling for once, not a new or more dangerous one.

**Still not done, and correctly out of scope for this sandbox:** actually querying `drizzle.__drizzle_migrations` on the live Neon database to see whether `0002`'s hash is recorded there. That requires a live database connection, which this review is not authorized to make (per the review's standing constraint against touching any live database) and which the `reconcile-migrations.ts` script itself would need `DATABASE_URL`/credentials to do. This remains a read-only-confirmed-on-disk, live-state-still-unknown item — recommend running (not from this sandbox) a **read-only** `SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at` against the live database to see whether 0002's hash appears, before deciding whether the journal file needs a manual entry added or the migration needs to be (re-)applied.

---

## 6. Two systems independently re-verified as stronger than "doc-claimed"

Two items the strategy review had flagged as "doc-claimed, not independently re-verified" were traced directly to code in this pass and can now be upgraded to **static-confirmed**:

**Fail-closed integration posture** (`packages/services/src/config/integrations.ts`, `packages/services/src/config/runtime-mode.ts`): `allowIntegrationMocks()` hard-returns `false` whenever `getRuntimeMode()` resolves to `"production"` — and the code comment states explicitly that this holds "even if `GUMA_ALLOW_INTEGRATION_MOCKS` is set," i.e. there is no environment-variable escape hatch in production. `getRuntimeMode()` correctly distinguishes Vercel's Preview environment (which sets `NODE_ENV=production`) from true production by checking `VERCEL_ENV` first — avoiding a common false-positive that would otherwise make Preview deployments behave as if they were live. `assertIntegrationReady()` throws a typed `IntegrationNotConfiguredError` (503) when an integration is neither configured nor mockable, which is the actual mechanism behind the "production never fakes success" claim.

**Lalamove live-vs-mock boundary**: Lalamove is registered with `severity: "optional"`, not `"required"` — meaning an unconfigured Lalamove is a warning, not a boot-blocker, and the code's own message states the explicit fallback: *"Lalamove not configured — live courier quote/book must fail (flat-rate fallback OK at checkout)."* This confirms both halves of the original open question precisely: Lalamove failures are fail-closed (no fake quote), and there is a deliberate, named, non-Lalamove fallback path (flat-rate) rather than the checkout simply breaking.

> **Correction (2026-08-20, after this document was first written):** where this document refers to the concurrency bug at `orders.ts:250` "self-acknowledged in a code comment," that was a misattribution. The `// row locked FOR UPDATE (deferred — see review remediation).` comment at line 250 belongs to the **coupon redemption cap** (lines 243–250), not to stock. The stock race is real but sits between an unlocked read at line 209 and an unconditional `greatest(stockQty - qty, 0)` decrement at ~380, with no acknowledging comment anywhere. See the corrected §1/§9 of `GUMA-SOCIAL-CHECKOUT-STRATEGY-REVIEW.md`.

**Active storefront default** was also re-confirmed at exact line numbers (not carried forward from memory): `apps/web/components/storefront/tenant-storefront-home.tsx` lines 89–169 are twenty sequential `pattern.storefrontRenderer === "<name>"` checks, and line 173 is the fallback: `return <ThemedStorefrontHome tenant={tenant} />;`. No neutral checkout-first surface exists in this dispatch — the strategy review's central open strategic question (§1 of that document) stands confirmed, not softened, by this closer look.

---

## 7. Proposed checkpoint — presented for approval, not yet executed

Given §1–§6, the proposed checkpoint strategy is much smaller and lower-risk than "commit 571 files" would suggest. Proposed slices, in order:

**Slice A — mechanical hygiene (near-zero risk, purely additive/config):**
1. Add a `.gitattributes` file setting `* text=auto eol=lf` (or the team's preferred convention) so this CRLF drift stops recurring on every Windows save.
2. Add `*.tsbuildinfo` to `.gitignore` and `git rm --cached` the three currently-tracked instances.
3. Re-normalize line endings repo-wide in one dedicated commit (`git add --renormalize .` after `.gitattributes` lands), isolated from any real content change so the diff is auditable as "whitespace only."

**Slice B — the one real content change:**
4. Commit `docs/AGENT-HANDOFF.md`'s new session-narrative section on its own.

**Slice C — requires a founder decision first, not just a commit:**
5. `simply-sweet-source` — resolve per §3 (submodule / subtree / untrack), then commit whichever shape is chosen.

**Explicitly not proposed:** any `db:push`, any live migration run, any deploy, any change to application logic, and no commit is proposed to include more than one of the above slices at a time, so each is independently revertable and auditable.

---

## 8. Go/no-go

**Go, with two conditions**, for the Slice A + Slice B checkpoint: both are mechanical/additive, fully explained above, and their diffs would be small and auditable if authorized. Recommend the founder request the actual diffs (or a dry-run) before final commit, since "propose, don't execute" was the standing instruction for this exact step.

**No-go, pending a decision, not more investigation**, for Slice C (`simply-sweet-source`) — this isn't blocked on more evidence, it's blocked on a founder choice among the three options in §3.

**Not resolved by this sandbox, flagged rather than assumed**: an actual green build/lint/typecheck/test run (§4) and a live read-only check of `drizzle.__drizzle_migrations` for the `0002` hash (§5). Both should be run directly on the Windows development machine or against a disposable/staging database, not inferred from static reading.

**Mission 001** (concurrent checkout stock safety, per the strategy review §13) remains correctly queued behind this mission and has not been started.

---

## 9. What's needed to actually execute Slice A/B

This document is the proposal. To proceed to an actual commit, the next message should confirm: (a) go-ahead to write `.gitattributes` and update `.gitignore`, (b) go-ahead to run the renormalize + stage + commit sequence for Slices A and B as described, and (c) a decision on `simply-sweet-source` (§3) before Slice C is attempted. No git write action (`add`, `commit`, `push`, `rm --cached`) has been taken yet.
