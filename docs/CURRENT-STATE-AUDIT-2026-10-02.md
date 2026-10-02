# Guma Kart (formerly GumaCommerce) — Current-State Product & Workflow Audit

**Date:** 2026-10-02
**Commit audited:** `f8b6232` on `wip/uncommitted-work-2026-08-01`. This is the gumakart rename commit; the code is otherwise identical to `07380bc`.
**Method:**
- The code was read directly. Docs, README files and comments were used only as pointers for what to check.
- Paths are repo-relative, and line numbers refer to that commit.
- Where this says "verified", I read the lines myself. The rest comes from four parallel code reads, cross-checked where they overlapped.

**Status labels**

| Label | Meaning |
|---|---|
| **Implemented** | Wired end to end |
| **Partial** | Some code exists, but the workflow is incomplete |
| **Configured / unclear** | Infrastructure exists, but real use is unproven |
| **Planned / dead** | Referenced, but not active |
| **Not found** | No code for it |

---

## 1. Executive summary

**What it is.** A multi-tenant **social-commerce storefront builder for Philippine sellers**.

A merchant:
1. Signs up.
2. Runs a guided "GUMA Launch" wizard (Store DNA → template → personalise → publish).
3. Adds products.
4. Shares a storefront link at `kart.guma.one/<slug>`, typically from FB, IG or TikTok.

Buyers order through a guest checkout (no buyer login). They pay either:
- **manually** to the merchant's own GCash/Maya/bank account, with the merchant confirming the payment, or
- **cash on delivery (COD)**.

The merchant then moves the order through statuses and books a Lalamove, Grab or manual rider.

**What a merchant can actually do today**
- Sign up by email or Google; this creates the tenant and owner user.
- Pick and personalise one of about 21 storefront templates, then publish.
- Create, edit and delete products, with AI help: descriptions, generation, price suggestions, background removal.
- Create categories. However, products are never assigned to them.
- Configure checkout (coupons, tax, minimum order, payment methods), shipping rules and SEO, using draft → approve → publish.
- Receive guest orders (COD or manual e-wallet), confirm payments, advance order statuses and refund.
- Book Lalamove, Grab or a manual rider, and have courier webhooks advance the order.
- Chat with buyers (with an optional AI shop assistant), receive web-push and SMS alerts, and file support tickets.
- Generate AI marketing drafts (posting and campaign agents). These are drafts only; nothing posts automatically.
- See a wallet ledger. Payouts are simulated.

**Primary workflow the code is built around:**
storefront setup → catalog → shared link → guest checkout → manual or COD payment → seller-driven fulfillment.

**Product surfaces**

| App | Who uses it |
|---|---|
| `apps/admin` | Seller console |
| `apps/web` | Marketing site, tenant storefronts, buyer checkout and tracking, and the `/kart` concept demo |
| `apps/platform` | Super-admin operations console |

**Integrations that actually run**
- PayMongo, using one platform-level key. Webhook verification is solid; live charging is unproven.
- Lalamove and Grab, plus manual delivery.
- Semaphore SMS.
- Resend email, used by the helpdesk only.
- Web push (VAPID).
- OpenAI, Gemini and Groq LLMs.
- remove.bg.
- OSM Nominatim geocoding.
- Inngest: events are sent to it, but every consumer is a log-only stub.
- Meta, GA4 and TikTok pixels, which fire PageView only.

**Classification: ecommerce/storefront-first.**
- The richest engineering is in storefront theming (21 hand-ported template renderers, plan-gated) and in the Launch wizard.
- Order creation goes through one generic, well-tested function.
- "Checkout" in this code means the storefront cart → checkout form. No checkout links or payment links exist.
- The checkout-first `/kart` "MINE" social flow is **UI-only demo data**.
- **POS does not exist.**
- Commerce-management features (orders, customers, delivery) are real, but they support the storefront.

**Most important architectural observations**
1. All three apps talk straight to one Postgres database (Neon) through `@gumakart/db` (Drizzle; a single schema file with 37 tables). There are no service boundaries and almost no app-to-app HTTP.
2. A great deal of tenant configuration lives in JSON columns on `tenants` (theme ×3, checkout draft/published, shipping draft/published, SEO, settings, Store DNA), not in tables.
3. There is an event bus: events are persisted to `domain_events` and optionally sent to Inngest. **No business logic consumes it.** Every side effect (SMS, push, wallet) is called inline from route handlers.
4. Money logic is spread across several writers that don't share a state machine. Stock is decremented at order creation and **never restored**. Several transitions bypass the transition guard.
5. Security problems a realignment has to fix:
   - Sellers can set their own `kycVerified` flag (**verified**).
   - KYC auto-approves on submit (**verified**).
   - Order pages and payment-reference endpoints are reachable with guessable order numbers.
   - The Grab webhook is unauthenticated when its secret is unset.

---

## 2. Repository / architecture overview

```text
apps/
  admin/      Next.js 15 / React 19 — seller console (port 3001). Crons in apps/admin/vercel.json.
              app/ (pages + ~70 API route.ts), components/ (managers, settings/*, plan/*), lib/ (api-auth, dashboard-nav, agents/*)
  web/        Next.js 15 — public site + storefronts + buyer checkout (port 3010).
              Cloudflare Workers via OpenNext: apps/web/wrangler.jsonc (worker gumakart-web, kart.guma.one, R2 gumakart-uploads)
              app/[tenantSlug]/…, app/kart/…, app/api/{checkout,delivery,orders,webhooks,chat,locations,support}
  platform/   Next.js 15 — super-admin console (port 3002). Mutations via server actions app/actions.ts.
packages/
  db/         Drizzle 0.38 + postgres-js. src/schema/index.ts (1295 lines, 37 tables), src/queries/*, drizzle/0000–0017
  auth/       jose HS256 JWT cookie `gumakart_session`, bcrypt, Google OAuth (src/service.ts, session.ts, types.ts, slug.ts)
  services/   payments/ (paymongo.ts, adapter.ts), delivery/ (provider.ts, orchestrator.ts, lalamove.ts, grab.ts, adapters/*),
              notifications/ (sms.ts Semaphore, email.ts Resend, push.ts VAPID), rate-limit.ts, runtime-mode
  events/     Inngest client, Zod event schemas (schemas.ts), emitDomainEvent (emit.ts), log-only functions.ts
  ai/         LLM providers (OpenAI/Gemini/Groq/mock), templates, generator, permissions SCOPE_MATRIX, plan limits
  plans/      Plan catalog (free ₱0 / growth ₱499 / pro ₱999) + entitlements
  storefront-themes/  21 patterns, SHOP_TEMPLATES, resolve-theme (plan downgrade), Brand Guard, Store DNA
  ui/         shared components
  media/      unused by any app
  storefront-templates/  docs only (no package.json)
.github/workflows/  deploy-kart.yml (web → Cloudflare on main/master/wip/**), brand-guard.yml
deploy.ps1          tar → scp → Proxmox CT 106 → pm2 (guma.one)
docker-compose.yml  local Postgres (Neon in production)
```

| Area | Where | Status |
|---|---|---|
| Frontend apps | `apps/admin`, `apps/web`, `apps/platform` | Implemented |
| Backend | Next.js route handlers and server actions inside each app; there is no separate backend service | Implemented |
| Data layer | `packages/db` (Drizzle, Neon Postgres) | Implemented |
| Auth | `packages/auth`; `apps/admin/middleware.ts` + `lib/api-auth.ts requireTenantSession()`; `apps/platform/middleware.ts` (super_admin) | Implemented |
| Background jobs | 3 Vercel crons (agents daily/weekly, agent-reminders); `/api/cron/wallet-settlement` exists but is **not scheduled** | Partial |
| Events | `packages/events` → `domain_events` table and Inngest | Configured / unclear (no consumers) |
| Messaging | SMS (Semaphore), push (VAPID), email (helpdesk only), buyer↔seller chat | Partial |
| Payments | PayMongo (platform key), manual e-wallet, COD; wallet ledger; simulated payouts | Partial |
| Storefront | `apps/web/app/[tenantSlug]`, `packages/storefront-themes` | Implemented |
| POS | — | **Not found** |
| Fulfillment | `packages/services/src/delivery/*` orchestrator (Lalamove / Grab / manual); BayanGo inert | Implemented (BayanGo: Planned) |
| Analytics | Seller dashboard counts; platform GMV/MRR; pixels PageView only | Partial |

**How the pieces communicate**
- Every app imports `@gumakart/db` and queries Postgres directly.
- The only app-to-app call is the platform → admin support-access link (`apps/platform/app/actions.ts:180`).
- Storefront links use `NEXT_PUBLIC_STOREFRONT_URL` and `NEXT_PUBLIC_ADMIN_URL`.
- Product images are written by admin to Vercel Blob, or to the local `apps/web/public/uploads` if Blob isn't configured. Web serves them from R2 first, then local disk.

**Multi-tenancy**
- Storefront: the **path slug** (`getStorefrontTenant`, `apps/web/lib/get-storefront-tenant.ts:82`).
- Admin: `users.tenant_id` from the session.
- There is **no `middleware.ts` in `apps/web`** (verified), no subdomain routing and no custom domains.

---

## 3. Actual merchant onboarding

| # | Step | Route / component | API → service | Tables | Required? | Status |
|---|---|---|---|---|---|---|
| 1 | Sign up (email) | `/signup` → `signup-wizard.tsx` (name, email, password; shop name, slug, category, vibe) | `POST /api/auth/signup` → `registerSeller` (`packages/auth/src/service.ts:127`), one transaction | `tenants` (status **pending**, plan free, theme seeded via `deriveBrandKit`, settings `{codEnabled, minOrderAmount:99}`), `users` (seller_owner) | Required | Implemented |
| 1b | Sign up (Google) | `/api/auth/google` → `/signup/shop` | `POST /api/auth/google/complete-shop` → `completeGoogleShopSetup` (`service.ts:379`) | same | Alternative | Implemented |
| 2 | Verify email | `/verify-email?token=` | `POST /api/auth/verify-email` | `users.email_verified_at` | Optional (banner only) | **Partial** — the email is never sent; `sendVerificationEmail` only logs the link (`service.ts:470-481`, verified) |
| 3 | Onboarding page | `/onboarding` | — | — | — | Dead: immediately `router.replace("/launch")` |
| 4 | Business profile / Store DNA → template → personalise → publish ("GUMA Launch") | `/launch` → `launch-wizard.tsx` (dna → templates → personalize → preview → done) | `GET/POST /api/launch` (`save_dna`, `select_template`, `personalize`, `publish`) → `queries/launch.ts`, `publishStorefrontWithApproval` (`change-requests.ts:864`) | `tenants` JSON columns, `change_requests` (auto-approved), `domain_events` | **Required**: `/` redirects to `/launch` while it is unfinished | Implemented |
| 5 | Business details | `/settings/shop` → `shop-settings.tsx` | `PATCH /api/settings` → `tenant-settings.ts` | `tenants` | Optional | Implemented |
| 6 | Logo / cover | Only in `components/shop-builder.tsx`, which is unreachable (`/shop-builder` → `/launch`) | `PATCH /api/shop` (no live caller) | `tenants` | — | Dead |
| 7 | Location / pickup address | Settings → Delivery & Shipping (free text) | `PATCH /api/settings` | `settings_json.delivery.pickupAddress` | Required only to book Lalamove/Grab | Partial — the `addresses` table and `pickup_address_id` are never used |
| 8 | Categories | `/categories` → `categories-manager.tsx` | `/api/categories` GET/POST/DELETE | `categories` | Checklist item | Partial — `products.category_id` is never written, so categories stay empty |
| 9 | Products | `/products` → `products-manager.tsx` | `/api/products`, `/[id]`, upload, media, `enhance-*`, `generate`, `suggest-*` → `createProductForTenant` | `products`, `product_variants` (one "Default"), `product_images` | Required to go live | Implemented. **Side effect:** the first active product auto-activates the tenant (`tryAutoActivateTenant`, `tenant-dashboard.ts:157`). |
| 10 | Payment setup | `/settings/payments` → `payments-settings.tsx` | `PATCH /api/settings` (sends 403 if `mode` is included) | `settings_json.payments.receiving` | Needed for manual e-wallet | Implemented (manual receiving accounts only) |
| 10b | PayMongo | Checklist "Activate payments" checks the **platform env key**, not the tenant | Mode set by ops only (`setTenantPaymentsModeAction`) | `settings_json.payments.mode` | — | Configured / unclear |
| 11 | Store setup / activation | Overview checklist → Activate | `POST /api/shop/activate` → `activateTenantShop` (needs ≥1 active product) | `tenants.status` | Usually automatic | Implemented |
| 12 | Domain | `/dashboard/domains` placeholder | — | — | — | Not found |
| 13 | Checkout setup | `/workspace/checkout` → `workspace-checkout.tsx` | `/api/checkout` GET/PATCH, `/submit`, `/suggest` → change request → publish | `checkout_draft_json` / `checkout_published_json` | Optional (defaults apply) | Implemented — but the "GUMA Workspace" nav entry is plan-locked for free sellers, so they can only reach it by typing the URL |
| 14 | POS setup | — | — | — | — | Not found |
| 15 | Fulfillment setup | (a) Settings → Delivery & Shipping; (b) `/workspace/shipping` | `PATCH /api/settings`; `/api/shipping` (+ `submit`/`suggest`) | (a) `settings_json.delivery`; (b) `shipping_*_json` | Optional | Partial — two sources of truth; checkout prefers (b), `book-delivery` reads only (a) |
| 16 | Messaging setup | `/settings/whatsapp-agent`, `/settings/notifications` | `PATCH /api/settings` | `settings_json` | Optional | Partial — WhatsApp is a wa.me link; email toggles are stored but never read |
| 17 | Checklist / progress | Overview `/` → `dashboard-view.tsx` from `getTenantDashboard` | — | computed | — | Implemented. Steps: shop, verify email, categories, launch, first product, payments ("Coming soon"), activate. |
| 18 | First sale | Buyer orders on the storefront → seller sees it in `/orders` | see §7 | — | — | Implemented |

**Branches**
- Plan (free / growth / pro) gates sidebar items, Workspace marketing and automations, about 18 AI API routes, and switching templates after publish.
- The simply-sweet template swaps in `SweetDashboardShell`, which has a shorter nav and is the only nav that shows `/customers`.
- Store category affects the template recommendation and the pricing UI.

---

## 4. Current navigation & information architecture

The admin sidebar is defined in `DASHBOARD_NAV` (`apps/admin/lib/dashboard-nav.ts`) and rendered by `admin-shell.tsx`. Locked items open an upgrade modal instead of navigating.

| Group | Item → route | What's there |
|---|---|---|
| — | Overview `/` | Checklist, totals (sales, orders, products), the shareable "Order Now" link |
| Commerce | Products `/products` | CRUD, uploads, AI assist |
| | Categories `/categories` | CRUD (products are never linked to it) |
| | Orders `/orders` | List; next-status action, cancel, confirm payment, refund, book delivery, assign rider |
| | Messages `/messages` | Buyer chat inbox + reply |
| | Storefront look `/launch` | Launch wizard (template, personalise, publish) |
| Customers & data (growth) | Users `/dashboard/users`, Analytics `/dashboard/analytics` | **Placeholders** ("coming in the next update", `plan-gated-page.tsx:33`) |
| Marketing & AI (growth) | GUMA Workspace `/workspace` (Overview, Approvals, SEO, Checkout, Shipping, Marketing, Automations); Integrations (placeholder); Tracking pixels `/settings/tracking` | Workspace is real; Integrations is a placeholder |
| Platform (pro) | Domains, Workflows, Code, Logs, API, Security (`/dashboard/*`) | **All placeholders**. The code says the group is "Base44-inspired". |
| Settings | shop, delivery-shipping, payments, notifications, subscription, wallet, kyc, account, whatsapp-agent, tracking, support | Mostly real. `account-settings` save is a no-op (`onSave={() => undefined}`). |

**Not in the main sidebar:** the working Customers CRM at `/customers` (it is only in the simply-sweet shell).

**Platform console** (`apps/platform/components/platform-shell.tsx`): Dashboard, Tenants, Subscriptions, Users, Orders, Helpdesk, Moderation, Template Intel, Frontends (landing switch), Settings, Audit Log.

**What the nav says the product is:** a storefront builder. Catalog, orders and "storefront look" come first; AI/Workspace is the upsell; a block of developer-platform items has nothing behind it.

---

## 5. Current feature inventory

| Feature | Status | Where | Main workflow | Notes |
|---|---|---|---|---|
| Products | Implemented | `apps/admin/app/api/products/*`, `queries/products.ts`, `products-manager.tsx` | Seller CRUD → storefront | One "Default" variant per product. The storefront shows a single price; there is no variant picker; `product_images` is not used by the storefront. |
| Variants | Partial | `product_variants` | Hidden | Price is stored on both product and variant; checkout uses `products.base_price`. |
| Inventory | Partial | `product_variants.stock_qty` | Decremented at order creation (atomic, tested) | No ledger, no reservations, **never restocked** on cancel, refund, payment failure or abandonment. Products with no variant row aren't tracked. |
| Categories | Partial | `/categories`, `categories` | CRUD | Products are never assigned a category. |
| Customers | Implemented (orphaned in nav) | `customers` table, `/customers`, `queries/customers.ts` | Upserted by phone inside checkout | No buyer accounts. Spend counts include unpaid orders. |
| Orders | Implemented | `queries/orders.ts`, admin `/orders`, web checkout | See §8 | Several writers bypass the transition guard. |
| Checkout (storefront) | Implemented | `apps/web/app/[tenantSlug]/checkout`, `POST /api/checkout` | Cart (localStorage) → form → order | Guest checkout only; no checkout links. |
| Checkout config | Implemented | `/workspace/checkout`, `checkout_*_json` | Draft → change request → publish | Coupons, tax, minimum, methods, automatic discount. |
| Abandoned checkout | Partial | `checkout_sessions`, `/api/checkout/abandon` | Captured as the buyer types; the seller sweeps by hand | No cron, no recovery message; the event has no consumer. |
| Payments – manual e-wallet | Implemented (**live default**) | `queries/manual-payments.ts`, `ManualPaymentPanel` | Buyer pays the merchant directly → submits reference or screenshot → seller confirms | Default mode `manual_ewallet` (`payments/adapter.ts`). |
| Payments – COD | Implemented | checkout route | Order starts as `accepted` | Payment is marked paid when delivered. |
| Payments – PayMongo | Configured / unclear | `packages/services/src/payments/paymongo.ts`, webhook | Intent → attach → redirect → webhook | Platform key only. **Attach sends `payment_method:{type}` inline with no `return_url` (verified, `paymongo.ts:128-141`)**, so the live e-wallet flow is very likely broken. Webhook verification is solid. |
| Refunds | Partial | `POST /api/orders/[id]/refund` | PayMongo refund → `markOrderRefunded` | Online payments only, full amount only, not idempotent. |
| Wallet / payouts | Partial | `queries/wallet.ts`, `/settings/wallet` | Ledger credit on paid, clearance, payout request | Payouts are **simulated** (`processQueuedPayouts`). Settlement cron is unscheduled. Credits include money that never passed through the platform (manual/COD). |
| KYC | Partial, **insecure** | `queries/kyc.ts`, `/settings/kyc`, `/kyc/mobile/[token]` | Upload IDs and selfie → submit | Auto-approved on submit. `kycVerified` is writable via `PATCH /api/settings`. |
| Plan billing | Partial | `/api/billing/upgrade`, `plan_payments`, `packages/plans` | PayMongo intent → webhook extends the plan 30 days | Depends on the PayMongo attach above. `plan_expires_at` is never enforced. |
| Ecommerce storefront | Implemented | `apps/web/app/[tenantSlug]`, `storefront-themes` | Path slug → themed home → product → cart → checkout | 21 templates; SEO metadata, JSON-LD, sitemap. |
| `/kart` "MINE" social checkout | Planned / dead (UI demo) | `apps/web/app/kart/*`, `lib/kart/demo.ts` | Setup → DM → checkout → track | Hard-coded seller and product; order saved to `sessionStorage` (verified, `components/kart/checkout.tsx:84-86`); `/api/kart/orders` doesn't exist. |
| Veyron POS | Not found | — | — | Only a marketing mention ("Veyron's Bakery"). |
| BayanGo | Planned / dead | `delivery/adapters/bayango-adapter.ts` | — | Never serviceable; missing from the `delivery_provider` enum. |
| Delivery (Lalamove / Grab / manual) | Implemented | `packages/services/src/delivery/*`, `book-delivery`, courier webhooks | Seller books → courier webhooks advance the order | Grab is "verify against partner docs"; manual booking is per order. |
| Messaging – SMS | Implemented | `notifications/sms.ts` (Semaphore) | Buyer "order confirmed" SMS; seller SMS on PayMongo paid (opt-in) | One buyer message, sent even for unpaid orders. |
| Messaging – push | Implemented (seller only) | `notifications/push.ts`, `sw.js` | New-order push | The DELETE subscription route isn't tenant-scoped. |
| Messaging – email | Partial | `notifications/email.ts` (Resend) | Helpdesk only | No order emails; verification email is not sent. |
| Messaging – chat | Implemented | `shop_chat_messages`, `/api/chat`, `/api/messages` | Buyer ↔ seller, optional AI auto-reply | |
| WhatsApp / Messenger | Partial / Not found | `whatsapp-settings.tsx`, `messenger-widget.tsx` | wa.me link; Messenger widget is UI only | No platform APIs. |
| Automations | Partial | `/workspace/automations` = AI posting agents; `content_queue`, `agent_runs`; crons | Daily/weekly drafts → seller marks "posted" by hand | No rules engine. |
| AI | Implemented | `packages/ai`, `/api/ai/generate`, `products/*`, `/api/chat`, agents | Plan-quota gated; change-request approval flow | Some "AI" suggestions (SEO, market price) are heuristics. |
| Approvals / change requests | Implemented | `change_requests`, `/workspace/approvals`, `POST /api/change-requests` | Draft → review / auto-approve → publish → rollback | Covers theme, pricing, catalog, SEO, checkout, shipping. |
| SEO | Implemented | `/workspace/seo`, `seo_*_json`, `[tenantSlug]/layout.tsx` | Draft → publish → metadata | The per-slug `robots.txt` has no effect. |
| Analytics | Partial | `getTenantDashboard`, `platform.ts` | Seller totals; platform GMV and MRR (MRR = list price × tenants) | `/dashboard/analytics` is a placeholder. |
| Tracking pixels | Partial | `storefront-tracking.tsx`, `/settings/tracking` | Meta, GA4, TikTok injected | PageView only; UTM is never stored. |
| Locations | Not found (multi-location) | `ph_locations` (PSGC) for buyer addresses | — | Free-text pickup address only. |
| Staff / users | Not found | `user_role.seller_staff` exists | — | No invites, no RBAC; one user per tenant. |
| Promotions | Partial | `checkout_published_json.coupons` / `automaticDiscount`, `computeCheckoutTotals` | Coupon at checkout | No coupon table, no expiry, no product scope; the redemption cap is soft. |
| Support / helpdesk | Implemented | `support_tickets*`, `/settings/support`, platform `/helpdesk` | Ticket ↔ agent reply with email | |
| Platform ops | Implemented | `apps/platform` | Tenant status and plan, moderation, templates, audit, support access | |
| Placeholder admin features | Planned / dead | `/dashboard/[feature]` | — | Users, Analytics, Integrations, Domains, Workflows, Code, Logs, API, Security |

---

## 6. Ecommerce / storefront workflow

| Stage | What actually happens |
|---|---|
| **Merchant store setup** | Launch wizard writes Store DNA and theme drafts. Publish copies them to `theme_published_json` via an auto-approved change request. `saveThemeDraft` also overwrites `theme_json`, and the storefront falls back to `theme_json` when nothing is published, so draft edits can show on an active shop. |
| **Catalog** | Products plus one default variant. Images go to `product_variants.image_url` (first image) and `product_images`. Categories exist but aren't linked. |
| **Storefront** | `kart.guma.one/<slug>`. Resolution order: `model` → hard-coded demo tenants (`lib/demo-data.ts`, 2,760 lines) → DB (`getTenantStorefrontBySlug`, `queries/storefront.ts:95`, active tenants only; `?preview=1` shows pending shops' drafts with no auth). Rendering dispatches through an if-chain in `tenant-storefront-home.tsx:78-173` to one of 21 hand-ported template folders. Plan gating: `resolveShopThemeForPlan`. Pages: home (`?category=`), product detail, checkout, order tracking, sitemap, robots. No search; no category route. |
| **Customer** | No buyer accounts. Identity is the phone number, upserted into `customers` at checkout. |
| **Cart** | `localStorage` key `guma-cart:<slug>` (`apps/web/lib/cart.ts`), maximum 99 per item, no variants. |
| **Checkout** | `/<slug>/checkout` → `checkout-form.tsx`: name, PH mobile, optional email, delivery or pickup, PSGC address (`/api/locations`), coupon, notes. Live courier quote via `/api/delivery/quote`. Session snapshot via `/api/checkout/session`. |
| **Payment** | Adapter chosen by mode (§7): manual e-wallet (default), COD, or PayMongo. |
| **Order** | `createOrderForTenant` (§8) — server-side prices, atomic stock, per-tenant number `ABC-0001`, customer upsert. |
| **Fulfillment** | Seller-driven statuses; seller books a courier; courier webhooks advance the order; the buyer tracking page polls. |
| **Notifications** | One buyer SMS at order creation; seller push (and SMS for PayMongo paid). No status-change messages to the buyer. |
| **Domains** | Not found (path slugs only). |

**Reusable for a broader Guma Kart**
- `createOrderForTenant`
- The checkout totals/config types and draft → publish pattern
- The PSGC address data and autosuggest
- The theme/template system (but see coupling in §18)
- SEO metadata and sitemap
- Tenant resolution with status gating

---

## 7. Checkout workflow

**Checkout creation.** Not found as a concept. Merchants share the shop or product URL (`apps/admin/lib/utils.ts storefrontUrl`; the Overview "Order Now" link adds `?utm_source=instagram`). There are no checkout links, payment links or comment-to-checkout.

**Configuration.** `checkout_published_json` holds methods, COD, pickup, `requireEmail`, tax, coupons, automatic discount, minimum order and `abandonedAfterMinutes`, via `/workspace/checkout` → change request.

**`POST /api/checkout`** (`apps/web/app/api/checkout/route.ts`, 512 lines) runs these steps in order:
1. Rate limit, 10/min/IP (Upstash, or in-memory).
2. Zod validation.
3. Demo-tenant short-circuit: returns a fake `DMO-…` order without touching the DB.
4. Load the tenant and its published settings.
5. Check the method is enabled, COD/pickup flags, minimum order and `requireEmail`.
6. `upsertCheckoutSession`.
7. Delivery fee: live quote (Lalamove/Grab via `quoteAll`), falling back to shipping rules or the flat rate.
8. `createOrderForTenant`, in one transaction.
9. `markCheckoutSessionConverted`, `recordDeliveryQuote`.
10. Pick the adapter with `resolvePaymentAdapterId`. Mode is resolved in this order: tenant `settings.payments.mode` (ops-only) → platform setting → `PAYMENTS_MODE` env → default `manual_ewallet`.
11. Emit `Order.Created.V1` (plus `Order.Succeeded.V1` for COD).
12. Run the adapter branch:
    - **cod:** SMS to the buyer, push to the seller.
    - **manual_ewallet:** `recordManualPaymentIntent` (`payment_transactions`, intent `manual_<orderId>`), instructions built from the merchant's receiving numbers, then SMS and push.
    - **paymongo:** `startOnlinePayment` (create + attach), `recordPaymentIntent`, SMS; returns `redirectUrl`.

**Customer identification:** phone number (guest).
**Addresses:** `orders.delivery_address_json`, built with PSGC pickers. `postalCode` is never sent.

**Payment confirmation**
- Manual:
  1. The buyer submits a reference or proof: `POST /api/orders/payment-reference` and `/payment-proof` (storage: Vercel Blob → R2 → disk). The transaction becomes `processing`.
  2. The seller confirms: `POST /api/orders/[id]/confirm-payment` → `confirmManualOrderPayment`. The order becomes `paid` and the wallet is credited.
- PayMongo: `POST /api/webhooks/paymongo`.
  - HMAC check with a 5-minute window and fail-closed behaviour.
  - `payment.paid` → `markOrderPaidByIntent`, then a seller SMS/push and `Order.PaymentSucceeded.V1`.
  - If no order matches the intent, it falls back to plan billing.

**Failed payments.** `payment.failed` only marks the transaction failed. The order stays `pending_payment`, stock stays held, and nobody is notified. No order expiry exists.

**Abandoned checkouts.** Sessions are captured. They are swept only when the seller clicks a button (`/api/checkout/abandon`), which emits `Checkout.Abandoned.V1`. Nothing consumes that event and no recovery message is sent.

**Confirmation.** `/<slug>/orders/<orderNumber>` shows the status history timeline, the delivery/driver block and the manual payment panel, and auto-refreshes. It is public, with no token, and order numbers are sequential.

**Tracking/analytics.** PageView pixels only. `orders.utm_json` and `meta_cart_origin` are never written; `source_channel` is always `"storefront"`.

---

## 8. Order lifecycle

**Statuses**

| Status family | Values |
|---|---|
| **Order** (`order_status` enum) | `pending_payment`, `paid`, `accepted`, `preparing`, `ready_for_pickup`, `out_for_delivery`, `delivered`, `cancelled`, `refunded` |
| **Payment** (`orders.payment_status` and `payment_transactions.status`, updated separately) | `pending`, `processing`, `paid`, `failed` (transaction only), `refunded` |
| **Delivery** (`deliveries.status`) | Free text holding raw courier strings (e.g. `PICKED_UP`, `ON_GOING`, `COMPLETED`, `ASSIGNED_MANUAL`) |
| **Fulfillment** | No separate field; folded into order status plus `delivery_type` |
| **Cancellation reason / partial refund** | Not found |
| **`/kart` demo** | Its own steps (`locked`/`packing`/`handed`/`otd`/`arrived`), unrelated to the DB |

**Transition guard** — `ORDER_STATUS_TRANSITIONS` (verified, `queries/orders.ts:42-52`):

```text
pending_payment → paid | cancelled
paid            → accepted | cancelled | refunded
accepted        → preparing | cancelled
preparing       → ready_for_pickup | out_for_delivery | cancelled
ready_for_pickup→ out_for_delivery | delivered
out_for_delivery→ delivered
delivered       → refunded
cancelled, refunded: terminal
```

It is enforced **only** in `updateOrderStatusForTenant` (the seller's `PATCH /api/orders/[id]`).

**Every writer**

| Writer | Caller | Transition | Side effects | Bypasses guard? |
|---|---|---|---|---|
| `createOrderForTenant` (`orders.ts:136`) | web checkout | → `accepted` (COD) or `pending_payment` | Stock −, customer upsert, history, number seq; route emits `Order.Created`, sends SMS and push | n/a |
| `markOrderPaidByIntent` (`:463`) | PayMongo webhook | `pending_payment` → `paid`; otherwise payment_status only (even on cancelled orders) | Wallet credit (idempotent); events, seller SMS and push. Not transactional. | Yes |
| `markPaymentFailedByIntent` (`:523`) | PayMongo webhook | none (transaction only) | none | — |
| `submitManualPaymentReference` | buyer | transaction → `processing` | history note | — |
| `confirmManualOrderPayment` | seller | → `paid` | Wallet credit; no events, no buyer notice | Yes |
| `updateOrderStatusForTenant` (`:644`) | seller PATCH | per guard | On `delivered`: COD → paid + immediate credit; online → release credit. **Cancel: no restock, no refund, no credit reversal.** PATCH to `refunded` changes status only. | Enforces |
| `markOrderRefunded` (`:743`) | seller refund route | → `refunded` from any paid state | PayMongo refund (before the DB write), wallet reversal; no restock, no event | Yes |
| `advanceOrderStatusFromDelivery` (`deliveries.ts:141`) | Lalamove/Grab webhooks | forward-only by its own rank map → `out_for_delivery` / `delivered` | COD delivered → paid, but **no wallet credit** (unlike the seller path) | Yes |

**Events.** Only `Order.Created`, `Order.Succeeded` and `Order.PaymentSucceeded` are emitted. Accept, ship, deliver, cancel, refund and manual confirm emit nothing.

**Notifications.** None on any status change.

**Inventory.** Decremented at creation for every method. Restock code does not exist anywhere.

**Customers.** `last_order_at` is updated at creation, including for orders that are never paid.

---

## 9. Veyron POS

**Not found.**
- No POS routes, components, tables, registers, shifts, receipts, sync APIs or webhooks exist in this repo.
- The only hit is marketing copy in `apps/web/components/marketing/guma/SocialProof.jsx` ("Veyron's Bakery").
- "Receipt" in the UI means the buyer's GCash screenshot upload.

**What a POS would share if it is built here**
- `products` / `product_variants` (stock)
- `orders` / `order_items` / `order_status_history`, where `orders.source_channel` already exists but is always `"storefront"`
- `customers`, keyed by tenant + phone

There is no location or branch model to attach a register to.

---

## 10. BayanGo / fulfillment

**Abstraction (Implemented).** `packages/services/src/delivery/provider.ts` defines `DeliveryProvider { isEnabled, isServiceable, quote, book, cancel?, parseWebhook? }`. `orchestrator.ts` provides:
- `quoteAll` — parallel quotes
- `compareQuotes` — ranks by ETA, then distance, then fee
- `autoSelect`
- `dispatch` — books with failover

The architecture **already supports multiple providers**. Nothing implements `cancel()`, and `parseWebhook` is never used (webhooks parse inline).

| Provider | Status | Notes |
|---|---|---|
| Lalamove | Implemented | HMAC-signed v3 quotations/orders; mock outside production; webhook requires a secret (503 if unset) |
| Grab | Implemented (unverified against partner docs) | OAuth2 client credentials; webhook **accepts unauthenticated calls if `GRAB_WEBHOOK_SECRET` is unset**; tracking URL never saved |
| Manual | Implemented | Flat fee, `PENDING_SELLER_DISPATCH`, assign-rider endpoint |
| BayanGo | Planned / dead | `isServiceable()` always false, `quote`/`book` throw; missing from the `delivery_provider` enum; book-delivery maps it to manual |

**Trace**
1. **Checkout quote:** `/api/delivery/quote` → `getCheckoutDeliveryQuote`. Both addresses are geocoded with OSM Nominatim (no key, 4 s timeout).
2. **Checkout:** the fee is written to the order and a `delivery_quotes` row is recorded; nothing is booked yet.
3. **Seller books:** `POST /api/orders/[id]/book-delivery`.
   - Allowed when the order is paid, accepted, preparing or ready_for_pickup.
   - Pickup address comes from `settings_json.delivery.pickupAddress`.
   - Calls `dispatch()`, then writes `delivery_quotes` and `deliveries`.
   - **Never automatic.**
4. **Rider:** partner couriers assign riders via webhook; manual riders use `assign-rider`.
5. **Webhooks** update `deliveries` (driver, plate, lat/lng) and run `advanceOrderStatusFromDelivery`.
6. **Courier cancelled/failed:** stored and logged only. The order is unchanged, there is no rebooking and nobody is notified.
7. **Tracking:** the buyer order page polls.

**Tables:** `delivery_quotes`, `deliveries`. `ordersRelations` declares one delivery per order; the code picks the latest.

---

## 11. Messaging & automation

| Channel | Status | Detail |
|---|---|---|
| SMS (Semaphore) | Implemented | Buyer order confirmation (all methods); seller payment received (PayMongo, opt-in `smsOnNewOrder`); seller "posts ready" reminder (cron) |
| Push (VAPID) | Implemented, seller only | New COD/manual order; PayMongo paid |
| Email (Resend) | Partial | Helpdesk ticket and reply only; verification email not sent; `emailOnNewOrder` / `emailOnOrderStatus` stored, never read |
| WhatsApp | Partial | wa.me link + greeting setting; no API |
| Messenger | Not found | Widget UI only |
| In-app chat | Implemented | `shop_chat_messages`; AI auto-reply optional |
| Templates engine / message log | Not found | Inline strings; `notification_channel` enum unused; sends are not persisted |

**Automations as they exist**

| Automation | Trigger → condition → delay → action → suppression |
|---|---|
| Order confirmation | Checkout → none → immediate → 1 buyer SMS (+ seller push for COD/manual) → no dedupe |
| Payment confirmation | PayMongo `payment.paid` → first transition only → immediate → seller SMS (opt-in) + push → `result.transitioned`. Manual confirm: **nothing sent**. |
| Delivery updates | **Not found** (the buyer must poll the order page) |
| Abandoned checkout | Seller clicks sweep → inactive ≥ `abandonedAfterMinutes` (default 60) → n/a → marks abandoned + emits event → **no message is ever sent** |
| Promotional | Cron `/api/cron/agents` daily (10:00) / weekly → plan and quota → AI drafts into `content_queue` → seller marks posted by hand |
| Agent reminder | Cron 09:00 → posts ready → seller SMS |

**Event-driven base.**
- There is a usable skeleton. `emitDomainEvent` validates with Zod, persists to `domain_events` (unique idempotency key) and optionally sends to Inngest. There are 27 event names, and the Inngest serve endpoint is `apps/admin/app/api/inngest`.
- But it is a post-commit dual write, not an outbox: there is no relay or processed flag, and errors are swallowed.
- Every consumer is a log-only stub.
- Crons are declared in `vercel.json`. Production admin deploys through `deploy.ps1` to pm2 on Proxmox, so it is **unclear whether these crons ever fire in production**.

---

## 12. Data model

One schema file: `packages/db/src/schema/index.ts`, 37 tables. Migrations `drizzle/0000–0017` match it; only 0000–0002 have snapshots.

| Entity | Table | Key fields / notes | Owner (writes) |
|---|---|---|---|
| Business / Store | `tenants` | slug, name, status (pending/active/suspended, varchar), plan, `plan_expires_at`, `next_order_seq`, and JSON: theme ×3, store_dna, seo ×2, checkout ×2, shipping ×2, settings | launch, tenant-settings, change-requests, platform actions |
| User | `users` | email/phone, `role`, `tenant_id` (one tenant per user), `session_version` | auth service |
| Location | — | **Not found**. `addresses` exists but is never queried; `ph_locations` is a PSGC lookup | — |
| Category | `categories` | parent_id (no FK); `shop_business_categories` is a separate platform taxonomy | queries/categories |
| Product | `products` | base_price, compare_at_price, status, `track_inventory`, `category_id` (never written) | queries/products, change-requests |
| Variant / Inventory | `product_variants` | price, **`stock_qty` (the only inventory)** | products, orders |
| Images | `product_images` | not used by the storefront | products |
| Customer | `customers` | (tenant, phone) unique, name, email, first/last order | orders (checkout upsert) |
| Cart | — | **Not found** (localStorage; snapshot in `checkout_sessions.cart_json`) | — |
| Checkout | `checkout_sessions` | session_key, cart/customer/address JSON, status active/converted/abandoned | queries/checkout |
| Order / OrderItem | `orders`, `order_items`, `order_status_history` | see §8; `customer_id` → users never written; guest_* duplicates customer | orders, manual-payments, deliveries, wallet |
| Payment | `payment_transactions` | gateway, intent id (unique), status, `raw_webhook_json` (overloaded with manual-payment proof data) | orders, manual-payments |
| Refund | — | Not a table (status + ledger `refund_debit`) | — |
| Fulfillment / Delivery | `delivery_quotes`, `deliveries` | provider enum, provider_order_id, free-text status, driver, tracking | queries/deliveries |
| Message | `shop_chat_messages`, `support_tickets*` | — | agents, support |
| Automation | `change_requests` (approval workflow), `agent_runs`, `content_queue` | no rule table | change-requests, agents |
| Page / Theme / Domain | JSON on `tenants`; `template_stock` | Pages: Not found; Domain: Not found | launch |
| POS transaction | — | **Not found** | — |
| Billing | `plan_payments` | | plan-billing |
| Wallet | `tenant_wallets`, `wallet_ledger_entries` (unique order + type), `tenant_payouts` | | wallet |
| KYC | `kyc_verification_sessions`, `kyc_documents` | | kyc |
| Events | `domain_events` | append-only log | events |
| AI | `ai_usage_monthly`, `ai_generations` (never inserted) | | ai-usage |
| Other | `push_subscriptions`, `platform_settings`, `platform_audit_log`, `template_intelligence_events`, `ph_locations` | | |

**Duplicate concepts**

| Concept | Duplication |
|---|---|
| Orders | DB `orders` vs the `/kart` demo (own payment enum `maya` vs real `paymaya`, own ₱25 COD fee, own `GK-YYYYMMDD-NNNN` number, own tracking steps, sessionStorage) |
| Customers | `users` (role `customer`, never created) vs `customers` (used) vs `orders.guest_*` |
| Price | `products.base_price` vs `product_variants.price` |
| Payment status | `orders.payment_status` vs `payment_transactions.status`, updated non-atomically; COD has no transaction row |
| Pickup address | `settings_json.delivery.pickupAddress` (used) vs `tenants.pickup_address_id` / `orders.pickup_address_id` (unused) |
| Shipping config | `settings_json.delivery` vs `shipping_published_json` (checkout prefers the latter; booking reads the former) |
| Theme | `theme_json`, `theme_draft_json`, `theme_published_json` (+ change-request before/after) |
| KYC | session table vs `settings_json.wallet.kycVerified` (payouts read only the JSON flag) |
| Status ordering | the guard matrix vs the `deliveries.ts` rank map vs the tracking page's map vs the admin UI's own next/cancel logic |
| Revenue | platform: paid only; customer spend: anything not cancelled or refunded (includes unpaid) |

---

## 13. APIs & integrations

### Commerce (admin, all `requireTenantSession`)

| Endpoint | Purpose |
|---|---|
| `GET/POST /api/products` | List, create |
| `PATCH/DELETE /api/products/[id]` | Edit, delete |
| `POST /api/products/upload`, `media`, `enhance-image`, `enhance-description`, `generate`, `suggest-market-price`, `[id]/suggest-price` | Media and AI assist |
| `GET/POST/DELETE /api/categories` | Categories |
| `GET /api/customers` | CRM |
| `GET/PATCH /api/shop`, `POST /api/shop/activate` | Shop state, activation |
| `GET/PATCH /api/settings` | Settings JSON (**accepts `wallet.kycVerified`**) |
| `GET/POST /api/launch` | Launch wizard actions |
| `POST /api/change-requests` | Approve, reject, publish, rollback |

### Checkout
- **Buyer (web):** `POST /api/checkout` (create order and start payment), `POST /api/checkout/session` (snapshot), `POST /api/delivery/quote`, `GET /api/locations`.
- **Seller config (admin):** `GET/PATCH /api/checkout`, `POST /api/checkout/submit`, `/suggest`, `/abandon`.

### Orders
- **Admin:** `GET /api/orders`, `PATCH /api/orders/[id]` (status), `POST …/confirm-payment`, `…/refund`, `…/book-delivery`, `…/assign-rider`.
- **Web (public):** `POST /api/orders/payment-reference`, `POST /api/orders/payment-proof`, `GET /uploads/payment-proofs/[...path]`.

### Payments
- **Web:** `POST /api/webhooks/paymongo`.
- **Admin:** `POST /api/billing/upgrade`, wallet routes under `/api/wallet`, `GET /api/cron/wallet-settlement` (unscheduled).

### Ecommerce
Storefront pages under `apps/web/app/[tenantSlug]` (server components, data via `@gumakart/db`); `sitemap.xml` and `robots.txt` routes.

### POS
Not found.

### Fulfillment
`POST /api/webhooks/lalamove`, `POST /api/webhooks/grab` (web); booking routes listed under Orders.

### Messaging
| Endpoint | Side | Purpose |
|---|---|---|
| `GET/POST /api/chat` | web | Buyer chat + AI assistant |
| `GET/POST /api/messages` | admin | Seller inbox |
| `GET/POST/DELETE /api/push/subscribe` | admin | Push subscriptions |
| `POST /api/support/tickets` | both | Support tickets |

### Authentication (admin)
- `POST /api/auth/signup`, `login`, `logout`
- `GET /api/auth/check-slug`
- `/api/auth/google` (+ callback, `complete-shop`)
- `POST /api/auth/verify-email`
- `/api/auth/support-access`, `exit-support`
- Platform: `/api/auth/{login,logout,session}`

### AI / agents (admin)
`POST /api/ai/generate`; `GET/POST /api/agents`; `POST /api/agents/run`; `PATCH /api/agents/queue`; crons `/api/cron/agents`, `/api/cron/agent-reminders`; `/api/inngest`.

### Analytics
No API. Server-side queries only (`getTenantDashboard`, `getPlatformStats`).

### External integrations

| Service | Configured by | Status |
|---|---|---|
| PayMongo | `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` | Live attach unproven |
| Lalamove | `LALAMOVE_*` | Implemented |
| Grab Express | `GRAB_*` | Implemented, unverified against partner docs |
| Semaphore SMS | `SEMAPHORE_API_KEY` | Implemented |
| Resend | `RESEND_API_KEY` | Helpdesk only |
| Web push | VAPID keys | Implemented |
| LLMs | OpenAI, Gemini, Groq | Implemented |
| remove.bg | API key | Implemented |
| OSM Nominatim | none (no key) | Implemented |
| Inngest | `INNGEST_*` | Configured, consumers are stubs |
| Upstash | Upstash credentials | Rate limiting |
| Vercel Blob / Cloudflare R2 | Blob token / R2 binding | Uploads |
| Meta / GA4 / TikTok pixels | Pixel IDs | PageView only |
| Google OAuth | Google credentials | Implemented |

---

## 14. Events, queues & background jobs

**Event names** (`packages/events/src/schemas.ts:4-32`)
- `Tenant.Created.V1`
- `Store.Published.V1`
- `Theme.Published / ChangeApproved / RolledBack.V1`
- `Catalog.ChangeApproved.V1`, `Pricing.ChangeApproved.V1`
- `Seo.Updated / ChangeApproved / Published / RolledBack.V1`
- `Checkout.Updated / ChangeApproved / Published / RolledBack / Abandoned.V1`
- `Shipping.Updated / RuleChanged / ProfileCreated / ChangeApproved / Published / RolledBack.V1`
- `Order.Created.V1`, `Order.Succeeded.V1`, `Order.PaymentSucceeded.V1`
- `Merchant.Upgraded.V1`
- `AI.PlanCompleted.V1` (never emitted)

**Emitters**
- Signup and Google complete-shop → `Tenant.Created`
- `/api/launch` → Theme and Store events
- `/api/change-requests` → all ChangeApproved / Published / RolledBack events
- seo / checkout / shipping routes → the `*.Updated` events
- `/api/checkout/abandon` → `Checkout.Abandoned`
- web checkout → `Order.Created` / `Order.Succeeded`
- PayMongo webhook → `Order.PaymentSucceeded` / `Order.Succeeded` / `Merchant.Upgraded`

**Consumers**
- `functions.ts` has six Inngest functions (store-published, order-payment-succeeded, merchant-upgraded, tenant-created, theme-published, theme-change-approved). **All are log-only.**
- About 20 other events have no consumer.
- No local handlers are registered.
- `listDomainEventsForTenant` is never called.

**Webhooks in:** PayMongo, Lalamove, Grab.

**Cron** (`apps/admin/vercel.json`, verified)
- `/api/cron/agents?mode=daily` at `0 10 * * *`
- `/api/cron/agents?mode=weekly` at `0 2 * * 1`
- `/api/cron/agent-reminders` at `0 9 * * *`
- All require `Bearer CRON_SECRET`.
- `wallet-settlement` is **not scheduled**.
- `apps/web/wrangler.jsonc` has no cron triggers.

**Queues / workers:** not found.

---

## 15. Current merchant journey (as built)

1. **Sign up.** Maria signs up at `admin…/signup` with her name, email, password, shop name, slug and category. A pending tenant and an owner user are created. She is told to verify her email, but **no email arrives**.
2. **Launch wizard (required).** She is redirected to `/launch` and completes Store DNA (her vibe), picks a template, personalises it and publishes. Behind the scenes a change request is auto-approved.
3. **Products.** She adds products (title, price, photo, stock; AI can write descriptions). The **first active product automatically makes the shop live** at `kart.guma.one/maria-shop`. She creates categories, but nothing lets her put products into them.
4. **Payments (configure).** In Settings → Payments she enters her GCash/Maya/bank receiving details. She cannot turn on PayMongo; that checklist step says "Coming soon".
5. **Delivery (configure).** In Settings → Delivery she sets the flat rate, the free-delivery minimum and a free-text pickup address, which she needs before booking couriers.
   - Optional: if she finds `/workspace/checkout` and `/workspace/shipping` (hidden from the free-plan sidebar), she can set coupons, tax and shipping rules.
6. **Share.** She copies the "Order Now" link from the Overview and posts it on IG/FB.
7. **A customer buys.** The buyer checks out as a guest. Maria gets a web push. The buyer gets one SMS ("order confirmed"), even though they haven't paid.
8. **Payment.** The buyer sends GCash to Maria's number and submits the reference or a screenshot. Maria opens `/orders` and clicks **Confirm payment** (she must check her own GCash first). The order becomes `paid` and a wallet credit appears.
   - COD orders skip this and start as `accepted`.
9. **Fulfillment.** Maria clicks through accepted → preparing, then **Book delivery**. Lalamove or Grab is quoted and booked, or she assigns her own rider.
10. **Delivery.** Courier webhooks move the order to out_for_delivery → delivered. If she uses her own rider, she updates the status by hand.
11. **Customer notification.** None after the first SMS. The buyer must reopen the order page.
12. **Completion.** On `delivered`, a COD order is marked paid and the wallet credit is released. Maria can request a payout from Wallet once "KYC verified". Payouts are **simulated**: no money moves.

**Points where Maria must configure something**
- The Launch wizard
- At least one product
- Receiving accounts (manual mode)
- The pickup address (for courier booking)

Everything else has defaults.

---

## 16. Current customer journey

1. **Discover.** Link from social media → `kart.guma.one/<slug>`, a themed home page. Pixels fire PageView.
2. **Product.** `/<slug>/products/<slug>` shows a single price; there is no variant choice and no gallery.
3. **Cart.** Stored in localStorage → `/<slug>/checkout`.
4. **Checkout.** Name, mobile, optional email, delivery or pickup, PSGC address, coupon. A live courier fee is shown, and stock is reserved at submit.
5. **Payment.**
   - Default: an instruction panel shows the merchant's GCash/Maya/bank numbers. The buyer pays outside the platform, then submits a reference or screenshot.
   - COD: nothing to do.
   - PayMongo (if ops enabled it): a redirect, with no return page.
6. **Confirmation.** The order page plus one SMS. No email.
7. **Fulfillment / delivery.** The order page polls and shows the status timeline and driver info (from courier webhooks).
8. **Post-purchase.** Shop chat and support tickets. No status SMS, no review request, no recovery messages. The page claims "SMS updates sent to your phone", but none are sent after the first.

---

## 17. Existing strengths / reusable systems (keep, don't rebuild)

| System | Why it's worth keeping |
|---|---|
| `createOrderForTenant` | Server-side pricing, per-tenant numbering, customer upsert and an atomic, conditional stock decrement inside one transaction, with a real concurrency test (`orders-concurrency.test.ts`). A generic order core for any channel (storefront, social, future POS via `source_channel`). |
| Delivery orchestrator | Provider interface, parallel quotes, ranking and failover dispatch; Lalamove/Grab clients; tracking. BayanGo can plug in as another adapter. |
| Storefront + theming | 21 templates, plan gating, Brand Guard, Store DNA, the Launch wizard, SEO/sitemap/JSON-LD. |
| Draft → approve → publish (`change_requests`) | Already covers theme, pricing, catalog, SEO, checkout and shipping, with rollback and a plan-based approval matrix. A good base for AI-proposed changes. |
| Checkout config model | Typed coupons, tax, minimum order, methods (`types/tenant-checkout.ts`, `computeCheckoutTotals`), shared by client and server. |
| Manual e-wallet + COD flows | The payment reality for small PH sellers; already end to end. |
| PayMongo webhook verification + idempotent mark-paid; wallet ledger (unique order + type) | Solid primitives, even though the attach flow and payouts need work. |
| PSGC address data + autosuggest | `ph_locations`, `/api/locations`, static JSON reused by `/kart`. |
| Event schema + `domain_events` log | The naming, Zod schemas and persistence exist; consumers need to be built. |
| AI provider layer + plan quotas | Multi-provider fallback, templates, usage metering. |
| Auth / session | Session-version revocation, support-access impersonation, tenant re-check on every API call. |
| Platform ops console | Tenants, plans, moderation, helpdesk, audit. |
| `/kart` UI | A clean design reference for the social-checkout flow (UI only). |

---

## 18. Duplications / technical debt / architectural risks

Each item is supported by code references above.

**Money and state integrity**
1. Order state has three status-rank systems plus the UI's own logic, and several writers bypass the guard. Specifically, the PATCH route can set `paid` or `refunded` without payment or wallet effects.
2. **Stock is never restored** on cancel, refund, failed payment or an abandoned `pending_payment` order. Orders that fail after creation hold stock, and retries create duplicate orders.
3. `markOrderPaidByIntent` and `confirmManualOrderPayment` are not transactional and take no row lock. The refund route calls PayMongo before the DB write with no idempotency key, so a retry can refund twice.
4. COD orders delivered via courier webhook never get a wallet credit; COD orders delivered via the seller path do.
5. Wallet credits are created for manual and COD sales whose money never passed through the platform. Payouts are simulated. The payout request does a read-then-write without a lock, so concurrent requests can over-withdraw.
6. Coupon redemption cap is a soft limit.

**Security**
7. Sellers can set `wallet.kycVerified` via `PATCH /api/settings` (verified), and KYC auto-approves on submit (verified). Together these unlock payouts.
8. Order tracking, `payment-reference` and `payment-proof` are public and keyed by a sequential order number.
9. The Grab webhook is unauthenticated when its secret is unset.
10. `?preview=1` exposes pending shops' draft themes.
11. The push-subscription DELETE route isn't tenant-scoped.
12. Demo tenants and unreserved route names (`kart`, `frontend1`, `*-demo`, `preview`, `uploads`) shadow real merchant slugs.

**Integrations**
13. PayMongo attach is likely broken live: inline `payment_method:{type}`, no `return_url` (verified). Per-method adapter flags are ignored in favour of a global mode. BayanGo is not in the enum. The Lalamove signature scheme is unverified.

**Architecture**
14. Configuration is spread across JSON columns, with two shipping configs, three theme copies and two KYC states. Many columns are never written (`category_id`, `utm_json`, `meta_cart_origin`, `customer_id`, `pickup_address_id`, `customizations_json`). The `addresses` table is unused.
15. The event bus has no consumers; all side effects are inline in route handlers. Crons depend on Vercel while admin may run on pm2.
16. Theme renderers are 21 hand-ported folders behind an if-chain, which is costly to change across all templates.
17. Dead or demo code mixed into production paths:
    - `demo-data.ts` (2,760 lines, checked before the DB)
    - `shop-builder.tsx`
    - `v0-store/checkout-drawer.tsx`
    - `/onboarding`
    - Nine placeholder dashboard features
    - The `@gumakart/media` package
    - The `storefront-templates` docs package

**What makes the Guma Kart realignment hard**
- The `/kart` checkout-first concept has **no backend**: no `/api/kart/orders`, no social-platform (Meta/IG/TikTok) integration, no checkout-link entity.
- Order source and attribution fields exist but are never populated.
- No buyer identity beyond phone.
- No POS, no locations, no staff roles.

---

## 19. Guma Kart alignment

The request text for this section was cut off after "Only after completi…".

Sections 1–18 are complete as requested, and they stop at the current state with no rebuild proposals. If you send the rest of the section 19 brief, I'll add it here.
