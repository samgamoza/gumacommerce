# Sprint 1 Progress Report — SEO Domain

**Date:** 2026-07-12  
**Status:** Complete (MVP DoD)

## Lifecycle (unchanged rails)

Merchant / AI draft → `change_requests` (domain `seo`) → human approval → publish to `seo_published_json` → audit + events.

Nothing publishes automatically. Scope `ai.suggest.seo` is `human_review` on all plans.

## Delivered

| Area | Location |
|------|----------|
| Migration | `packages/db/drizzle/0008_seo_draft_publish.sql` (`seo_draft_json`, `seo_published_json`) |
| Types / normalize | `packages/db/src/types/tenant-seo.ts` |
| Queries | `packages/db/src/queries/seo.ts` + `publishSeoChangeRequest` / `rollbackSeoChangeRequest` |
| Permission | `ai.suggest.seo` in `packages/ai/src/permissions.ts` |
| Events | `Seo.Updated.V1`, `Seo.ChangeApproved.V1`, `Seo.Published.V1`, `Seo.RolledBack.V1` |
| Admin APIs | `GET/PUT /api/seo`, `POST /api/seo/suggest`, `POST /api/seo/submit`; CR approve/publish/rollback |
| UI | `/workspace/seo`, Approvals SEO diffs + publish + rollback |
| Storefront | `generateMetadata`, JSON-LD, `/{slug}/robots.txt`, `/{slug}/sitemap.xml` |
| Tests | `tenant-seo.test.ts`, `seo-events.test.ts` |
| Docs | `ARCHITECTURE.md`, `CROWN-JEWEL-AI-APPROVAL.md` |

## Event name mapping (ADR)

Sprint brief used `seo.updated` / `seo.published` / `seo.approved` / `seo.reverted`.  
Implemented as handbook `Domain.Event.V1`: Updated / Published / ChangeApproved / RolledBack.

## DoD checklist

- [x] Compiles (db / events / admin / web typecheck)
- [x] Unit tests for SEO normalize + event schemas
- [x] No parallel approval engine — reuses `change_requests`
- [x] Audit on publish / rollback
- [x] Events emitted on update / approve / publish / rollback
- [x] Docs updated
- [x] Storefront consumes **published** SEO only

## Not in this sprint

Checkout, Shipping, Plan catalog unification (D4), priority template ports.
