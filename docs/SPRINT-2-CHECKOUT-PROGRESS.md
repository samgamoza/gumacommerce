# Sprint 2 Progress Report — Checkout Domain

**Date:** 2026-07-12  
**Status:** Complete (MVP DoD)

## Lifecycle (unchanged rails)

Merchant / AI draft → `change_requests` (domain `checkout`) → human approval → publish to `checkout_published_json` (+ mirror COD / min-order / auto-accept into `settings_json`) → audit + events.

Nothing publishes automatically. Scope `ai.suggest.checkout` is `human_review` on all plans.

## Delivered

| Area | Location |
|------|----------|
| Migration | `packages/db/drizzle/0009_checkout_domain.sql` |
| Types / totals | `packages/db/src/types/tenant-checkout.ts` |
| Queries | `packages/db/src/queries/checkout.ts` + publish/rollback CR helpers |
| Permission | `ai.suggest.checkout` |
| Events | `Checkout.Updated/ChangeApproved/Published/RolledBack/Abandoned.V1`, `Order.Created.V1`, `Order.Succeeded.V1` |
| Payment adapter | `packages/services/src/payments/adapter.ts` (COD + PayMongo) |
| Admin APIs | `GET/PUT /api/checkout`, suggest, submit, abandon sweep |
| UI | `/workspace/checkout`, Approvals publish/rollback |
| Storefront | Cart session sync, email/address/coupon/tax lines, adapter-gated methods |
| Order path | Discount + tax + coupon on `createOrderForTenant` |
| Tests | checkout normalize/totals + event schemas + permission |
| Docs | `ARCHITECTURE.md`, `CROWN-JEWEL-AI-APPROVAL.md`, this report |

## Runtime vs config

Buyer checkout already existed (localStorage cart → API → PayMongo/COD → confirmation). Sprint 2 puts **configuration** on CR rails and adds taxes, coupons, adapters, abandoned sessions, and success events without a parallel workflow engine.

## Not in this sprint

Shipping profiles/zones/rates (Sprint 3), plan catalog unification (Sprint 4), priority template ports (Sprint 5).
