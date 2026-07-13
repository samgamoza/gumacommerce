# Sprint 3 Progress Report — Shipping Domain

**Date:** 2026-07-13  
**Status:** Complete (MVP DoD)

## Lifecycle (unchanged rails)

Merchant / AI draft → `change_requests` (domain `shipping`) → human approval → publish to `shipping_published_json` (+ mirror compact delivery into `settings_json.delivery`) → audit + events.

Nothing publishes automatically. Scope `ai.suggest.shipping` is `human_review` on all plans.

## Delivered

| Area | Location |
|------|----------|
| Migration | `packages/db/drizzle/0010_shipping_domain.sql` |
| Types / fee resolver | `packages/db/src/types/tenant-shipping.ts` |
| Queries | `packages/db/src/queries/shipping.ts` + publish/rollback CR helpers |
| Permission | `ai.suggest.shipping` |
| Events | `Shipping.Updated/ChangeApproved/Published/RolledBack/ProfileCreated/RuleChanged.V1` |
| Admin APIs | `GET/PUT /api/shipping`, suggest, submit |
| UI | `/workspace/shipping`, Approvals publish/rollback |
| Storefront | Published shipping drives fee/ETA; Lalamove live quotes unchanged |
| Tests | shipping normalize/fee + events + permission |
| Docs | `ARCHITECTURE.md`, `CROWN-JEWEL-AI-APPROVAL.md`, this report |

## Capabilities covered

Profiles · Zones · Rates (flat / price / weight bands) · Free-shipping rules · Courier providers · Estimated delivery · Pickup · Local delivery — all versioned via CR publish.

## Not in this sprint

Plan catalog unification (Sprint 4), priority template ports (Sprint 5).
