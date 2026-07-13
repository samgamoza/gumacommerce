# Sprint 5 — Priority Template Ports

**Status:** Complete  
**Date:** 2026-07-13  
**Queue:** `listPriorityPortQueue()` — aircon → carserv → motto → studio

## Goal

Port the four Phase 4 priority Free Bundle 2023 templates into live Guma React storefronts (HTML→React), with demos and catalog status `integrated`. No new CR domains or events.

## Delivered

| ID | Fit | Source | Demo | Renderer |
|----|-----|--------|------|----------|
| `aircon` | HVAC service-booking | `reference/aircon-1.0.0/aircon-main` | `/aircon-demo` | `apps/web/components/storefront/aircon/` |
| `carserv` | Auto repair service-booking | `reference/carserv-1.0.0/carserv-main` | `/carserv-demo` | `apps/web/components/storefront/carserv/` |
| `motto` | Moto gear ecommerce | `reference/motto-1.0.0/motto-main` | `/motto-demo` | `apps/web/components/storefront/motto/` |
| `studio` | Photo + print interim | `reference/studio-1.0.0/studio-master` | `/studio-demo` | `apps/web/components/storefront/studio/` |

### Platform wiring
- `SHOP_TEMPLATE_IDS` / `STORE_PATTERN_IDS` / `StorefrontRenderer`
- `templates.ts`, `patterns.ts`, `template-registry.ts`, `template-packages.ts`, `template-previews.ts`
- `recommend-templates.ts` affinity + `resolveInstallId` fallbacks
- `bundle-catalog.ts` status → `integrated`
- `tenant-storefront-home.tsx` dynamic dispatch
- DB `patternId` union (`schema` + `tenant-storefront` queries)
- Demo tenants in `apps/web/lib/demo-data.ts`

## Explicit non-changes
- No new `change_requests` domains
- Remaining 82+ bundle entries stay queued / variant-of-integrated
- Appointment/quote CRM beyond on-page forms deferred

## Verify

```bash
pnpm --filter @guma-commerce/storefront-themes exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
# Dev: http://localhost:3010/aircon-demo | /carserv-demo | /motto-demo | /studio-demo
```

## Next

Further bundle ports as demand warrants (haircut, feane, dentcare, …) — not blocking Phase 4 breadth closeout.
