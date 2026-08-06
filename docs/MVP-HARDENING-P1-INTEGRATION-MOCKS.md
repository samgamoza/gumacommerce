# MVP Hardening — Priority 1: Eliminate silent mock behavior

**Status:** Implemented (2026-08-05)  
**Scope:** Fail-closed external integrations for real MVP release  
**Non-goals:** No product redesign, no new features, no refactors beyond release blockers

---

## Policy

| Runtime | Behavior |
|---------|----------|
| **development** | Explicit labeled mocks allowed when credentials are missing (log + `mock: true`) |
| **test** | Deterministic mock adapters allowed |
| **production** (`VERCEL_ENV=production` or bare `NODE_ENV=production`) | Missing credentials → throw / return failure — **never** fake success |

Override: `GUMA_ALLOW_INTEGRATION_MOCKS=false` forces fail-closed in development.  
`GUMA_ALLOW_INTEGRATION_MOCKS=true` is **ignored** in production.

---

## Central validator

Package: `@guma-commerce/services`

| Export | Role |
|--------|------|
| `getRuntimeMode` / `allowIntegrationMocks` | Runtime posture |
| `getIntegrationReport` / `getIntegrationChecks` | Full audit snapshot (no secrets) |
| `assertIntegrationReady(id)` | Throws `IntegrationNotConfiguredError` when live call cannot proceed |
| `integrationHealthPayload()` | JSON for health routes |
| `logIntegrationStatusOnce()` | One-shot structured log per process |

Files:

- `packages/services/src/config/runtime-mode.ts`
- `packages/services/src/config/integrations.ts`
- `packages/services/src/config/integrations.test.ts`

---

## Clients updated

| Integration | Before | After |
|-------------|--------|-------|
| PayMongo | Silent mock on empty / `sk_test_xxx` | Prod throws; dev labeled `mock: true` |
| Lalamove | Silent mock quote/book | Prod throws; mock book refused outside mock runtimes |
| Grab | Silent mock | Same as Lalamove |
| Semaphore SMS | `success: true, mock: true` always when empty | Prod: `success: false` (not sent); dev labeled mock |
| Web Push | `sent: 0` (already truthful) | Warn log when VAPID missing |
| Google OAuth | Already throws | Unchanged; reported in health |
| AI (`resolveEffectiveModel`) | Silent fallthrough to `mock` | Prod throws if no LLM keys |

Wallet/KYC: no silent success mocks found (DB + upload flows).

---

## Health checks

- Storefront: `GET /api/health/integrations` → `apps/web`
- Admin: `GET /api/health/integrations` → `apps/admin`

Returns `200` when no production blockers; `503` when required integrations are missing in production posture. Never includes secret values.

Checkout and book-delivery map `IntegrationNotConfiguredError` → **503** with `code: "integration_not_configured"`.

---

## Verify

```powershell
pnpm --filter @guma-commerce/services test
```

Manual:

1. Unset `PAYMONGO_SECRET_KEY`, set `VERCEL_ENV=production` (or deploy) → online checkout must 503, not redirect to a mock PayMongo URL.
2. Unset Lalamove keys in production → book-delivery must 503, not return `lalamove_mock_*`.
3. Unset Semaphore in production → SMS result `success: false` (order can still complete for COD).
4. Hit `/api/health/integrations` and confirm `mode`, `allowMocks`, and per-integration `status`.

---

## Operator checklist (production)

Required before go-live:

- [ ] `AUTH_SECRET` ≥ 32 chars (not the example placeholder)
- [ ] `PAYMONGO_SECRET_KEY` (real test or live key — not `sk_test_xxx`)
- [ ] `PAYMONGO_WEBHOOK_SECRET`
- [ ] `DATABASE_URL` / Neon

Strongly recommended:

- [ ] `LALAMOVE_API_KEY` + `LALAMOVE_API_SECRET` (if using live courier booking)
- [ ] `SEMAPHORE_API_KEY` (if SMS confirmation is expected)
- [ ] At least one of `GEMINI_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` (if AI Workspace is sold)
- [ ] VAPID keys (if seller push is expected)
