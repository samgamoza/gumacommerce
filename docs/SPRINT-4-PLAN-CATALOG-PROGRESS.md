# Sprint 4 — Plan Catalog Unification (ADR D4)

**Status:** Complete  
**Date:** 2026-07-13  
**ADR:** ADR-0001 D4

## Goal

One canonical plan catalog. Do **not** invent Free/Starter/Growth/Pro as DB IDs.

| Layer | Canonical |
|--------|-----------|
| **DB / billing IDs** | `free` · `growth` · `pro` (stable) |
| **Constitution labels** | Free · Pro · Advance |
| **Handbook** | FREE→`free`, PRO→`growth`, ADVANCE→`pro` |
| **Prices** | ₱0 / ₱499 / ₱999 |
| **Aliases** | `starter`→`growth`, `advance`→`pro`, `sulit`→`free` |

## Delivered

| Area | What landed |
|------|-------------|
| Package | `@guma-commerce/plans` — `SELLER_PLANS`, prices, `normalizePlanId`, `planAtLeast`, `PLAN_AI_LIMITS`, client-safe |
| Compat re-exports | `packages/db/src/plans.ts`, `packages/ai/src/plan-limits.ts` |
| Consumers | admin `plan-access` / subscription UI, web storefront + landing, platform `CLIENT_PLANS` |
| Copy alignment | Free/Pro/Advance on feature gates, upgrade banners, FAQ, shop-builder, refunds, platform tenant filters |
| Docs | ADR D4 amendment, `ARCHITECTURE.md`, `CROWN-JEWEL-AI-APPROVAL.md`, this report |

## Explicit non-changes

- Stored `subscription_plan` / `plan_payments` values unchanged (`growth` \| `pro` PayMongo contract intact)
- No migration rewriting historical `starter` rows (normalize at read time)
- No Sprint 5 template ports

## Verify

```bash
pnpm install
pnpm --filter @guma-commerce/plans test
pnpm --filter @guma-commerce/db exec tsc --noEmit
pnpm --filter @guma-commerce/ai exec tsc --noEmit
```

## Next

Priority template ports (Sprint 5) — Aircon, Car Service, Motto, Studio.
