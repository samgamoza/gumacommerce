# Guma Commerce — Chief Engineer Review Summary

**Date:** 2026-08-06  
**Audience:** Chief Engineer / final architecture & launch readiness review  
**Repo:** `D:\All Apps\gumacommerce` (`@guma-commerce/*`)  
**Branch snapshot:** `wip/uncommitted-work-2026-08-01` (large uncommitted delta — treat working tree as source of truth until committed)  
**Companion docs:** `COMPREHENSIVE-HANDOFF-2026-07-12.md`, `DELIVERY-AND-HELPDESK.md`, `MVP-MANUAL-EWALLET-CHAT.md`, `ADR-0001-handbook-adoption.md`

---

## 1. One-line verdict

**Soft-launchable MVP+ for Philippine social sellers** — real multi-tenant commerce, seller ops, platform console, dual marketing landings, owner-led chat, multi-courier delivery wiring, and ticketed helpdesk — **not** yet a fully automated logistics/payments/AI Workstation product.

---

## 2. What the product is

Guma Commerce turns Facebook / TikTok / IG social selling into a branded mobile storefront with:

- Guest checkout (GCash / Maya / COD; **manual e-wallet** path for MVP)
- Seller Launch → products → orders → optional AI content
- Super-admin ops over all shops
- Courier booking (Lalamove / GrabExpress when keyed; manual Angkas/Move It/own rider)
- Ticketed platform helpdesk (separate from buyer↔seller shop chat)

**Not claiming yet:** full PayMongo settle in all envs, auto-dispatch on payment, Meta Messenger, LangGraph Workstation, 100 live templates, Angkas/Move It partner APIs.

---

## 3. System topology

| App | Port | Responsibility |
|-----|------|----------------|
| `apps/web` | **3010** | Marketing (`frontend1` / `frontend2`), `/{tenantSlug}` storefronts, checkout, buyer chat, courier + payment webhooks |
| `apps/admin` | **3001** | One shop’s Launch / Workspace / products / orders / messages / settings |
| `apps/platform` | **3002** | Super-admin: tenants, plans, users, **helpdesk**, moderation, frontends switch, audit |

```
Buyer / Seller / Super-admin
        ↓
web :3010 | admin :3001 | platform :3002
        ↓
packages/{db, auth, ai, plans, services, events, storefront-themes, ui}
        ↓
Neon Postgres | PayMongo* | Lalamove* | Grab* | Semaphore* | optional Upstash/Blob
(* degrade to mocks / manual when keys missing — see MVP hardening docs)
```

**Shared auth:** JWT cookie `gumacommerce_session` (`packages/auth`).  
**Plans:** single catalog `@guma-commerce/plans` — Free / Pro / Advance (`free` / `growth` / `pro`).  
**Hard rules:** never `db:push` on live Neon; never import `@guma-commerce/db` from `"use client"`.

---

## 4. Architecture health (Chief view)

| Area | Assessment | Notes |
|------|------------|-------|
| Multi-tenancy | **Solid** | App-level `tenantId` scoping; slug = public URL |
| Commerce core | **Solid MVP** | Cart, checkout, orders, status machine, COD + manual e-wallet |
| Payments | **Conditional** | Manual e-wallet first; PayMongo when keys + mode allow; prod mocks refused |
| Delivery | **Wired, credential-gated** | Orchestrator quote/book + failover; Lalamove/Grab webhooks; Assign rider for offline couriers |
| Seller UX | **Good enough** | Launch, products (manual-first + AI enhance), orders book/assign, messages inbox |
| Buyer chat | **MVP Beta** | Owner-led inbox + AI FAQ; polling; WhatsApp overflow — no websockets / Messenger |
| Helpdesk | **New / usable** | Tickets + SLA clocks; intake on web + admin; agent console on platform |
| Marketing | **Two skins, one backend** | `frontend1` (GumaCommerce) wired CTAs; `frontend2` (Guma One.ai) more aspirational |
| Templates | **Strong portfolio** | 18 live HTML→React ports + token themes; Free Bundle catalogued |
| AI / CR rails | **Partial handbook** | Crown-jewel draft→approve→publish for theme/catalog/pricing/SEO/checkout/shipping; no unified Workstation |
| Platform ops | **Useful** | Tenants/users/plans/moderation/helpdesk/frontends/audit |
| Observability | **Thin** | Integration health routes; Sentry optional; no full SLO dashboards |
| Test / CI | **Light** | Package unit tests (plans, orchestrator, etc.); not full E2E suite |
| Deploy | **Documented** | Vercel 3-app; production cutover not assumed complete |

---

## 5. Major deltas since prior comprehensive handoff (through 2026-08-06)

### Commerce & ops
- **Manual e-wallet checkout** + payment proof / confirm-payment seller flow
- **Chat MVP Beta:** storefront Message seller, seller `/messages`, WhatsApp overflow (`MVP-MANUAL-EWALLET-CHAT.md`)
- **Cart UX:** optimistic add, sticky cart bar, Order Now → checkout when cart has items
- **Products:** spacebar/description fix; AI demoted to enhance + suggest price (not AI-first listing)
- **Seller shell calm-down:** quieter nav/badges/overview

### Delivery (orchestrator live in apps)
- Quote/checkout/book use `quoteAll` / `dispatch` (not Lalamove-hardcoded only)
- Preferred provider + failover (Lalamove ↔ Grab ↔ manual)
- Grab webhook `/api/webhooks/grab`
- **Assign rider** UI/API for Angkas / Move It / own rider
- Detail: `DELIVERY-AND-HELPDESK.md`

### Helpdesk
- Tables: `support_tickets`, `support_ticket_messages` (migration `0013_support_helpdesk` applied)
- SLA: 4h first response / 48h resolve
- Surfaces: web `/contact`, admin Help & support, platform `/helpdesk`

### Marketing
- Frontend1 CTA audit: mobile nav, same-origin `/model`, contact → tickets, storefront default `:3010`
- Platform Frontends switcher preview base URL corrected to `:3010`

---

## 6. Launch readiness matrix

| Gate | Status | Blocker if missing |
|------|--------|--------------------|
| Seller signup → Launch → product → go live | ✅ Ready | — |
| Buyer order (manual e-wallet / COD) | ✅ Ready | Clear “how to pay” copy |
| Demo shop in production | ⚠️ Gate | Set `NEXT_PUBLIC_ENABLE_DEMO_SHOP=true` or use real tenant |
| Live Lalamove/Grab | ⚠️ Ops | Partner keys + webhook registration + seller pickup address |
| PayMongo card/e-wallet API | ⚠️ Ops | Real keys; `PAYMENTS_MODE` |
| Platform helpdesk staffing | ⚠️ Ops | Monitor `/helpdesk` + email |
| Legal entity footer | ⚠️ Content | SEC/TIN still placeholder in marketing |
| Suspended user/tenant enforcement | ❌ Gap | Platform can suspend; seller/storefront not fully hard-blocked |
| Brand Guard CI / Launch polish | ❌ Not started | Specced in `PRIORITY-SCOPE-BRAND-GUARD.md` |
| Production Vercel + secrets | ⚠️ Assumed incomplete | Follow `DEPLOY-VERCEL.md` |

**Recommended launch posture:** Soft launch with **frontend1 live**, manual e-wallet + COD, Book courier / Assign rider, staffed helpdesk — market auto-dispatch and partner Angkas APIs only after credentials + soak.

---

## 7. Risk register (top)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Marketing overclaims (auto-dispatch Angkas, instant PayMongo) vs shipped reality | High (trust) | Copy pass on frontend2 / FAQ; keep frontend1 as launch skin |
| Large uncommitted working tree | High (ops) | Commit/PR in slices before production cut |
| Integration mocks leaking to prod | High | `MVP-HARDENING-P1-INTEGRATION-MOCKS.md` + env discipline |
| Nominatim geocode rate/reliability | Medium | Cache or paid geocoder later; flat fee fallback exists |
| Helpdesk without email/push notify | Medium | Agents poll platform queue; add email later |
| Schema/journal history quirks | Medium | Prefer migrate/reconcile; never `db:push` |
| Client importing `@guma-commerce/db` | High if violated | Established pitfall — keep packages split |

---

## 8. Recommended next engineering order

1. **Commit hygiene** — slice PRs: delivery+helpdesk, chat+manual pay, frontend1 polish, docs  
2. **Prod env checklist** — AUTH_SECRET, DATABASE_URL*, STOREFRONT/ADMIN URLs, demo flag, payment/delivery keys  
3. **Honest marketing + demo always-on**  
4. **Suspend enforcement** on admin login + storefront  
5. **Brand Guard** Slice A/B (`PRIORITY-SCOPE-BRAND-GUARD.md`)  
6. **Helpdesk notifications** (email on create/reply)  
7. **Workstation convergence** only after launch stability  

---

## 9. How to verify locally (15 minutes)

```powershell
cd "D:\All Apps\gumacommerce"
pnpm install
pnpm db:migrate

pnpm --filter @guma-commerce/web run dev        # :3010
pnpm --filter @guma-commerce/admin run dev      # :3001
pnpm --filter @guma-commerce/platform run dev   # :3002
```

| Check | URL |
|-------|-----|
| Frontend1 | http://localhost:3010/frontend1 |
| Demo shop | http://localhost:3010/demo |
| Model store | http://localhost:3010/model |
| Seller | http://localhost:3001/login |
| Platform | http://localhost:3002/login — `admin@guma.ph` / `GumaAdmin2026!` (change before shared use) |
| Helpdesk | http://localhost:3002/helpdesk |
| Contact ticket | http://localhost:3010/contact |

Typecheck (known clean after 2026-08-06 delivery/helpdesk pass):  
`pnpm --filter @guma-commerce/{db,web,admin,platform} exec tsc --noEmit`

---

## 10. Doc map for deeper review

| Doc | Use when |
|-----|----------|
| **This file** | Executive / architecture / launch decision |
| `COMPREHENSIVE-HANDOFF-2026-07-12.md` | Whole-repo detail + sprint history |
| `AGENT-HANDOFF.md` | Session narratives + pitfalls |
| `DELIVERY-AND-HELPDESK.md` | Courier + tickets how-to |
| `MVP-MANUAL-EWALLET-CHAT.md` | Chat beta contract |
| `MVP-HARDENING-P1-INTEGRATION-MOCKS.md` | Prod mock refusal rules |
| `ADR-0001-handbook-adoption.md` | Binding hybrid architecture decisions |
| `PRIORITY-SCOPE-BRAND-GUARD.md` | Next anti-slop product scope |
| `ARCHITECTURE.md` / `DATABASE.md` / `DEPLOY-VERCEL.md` | Reference |

---

## 11. Sign-off questions for Chief Engineer

1. Accept **manual e-wallet + Book/Assign rider** as the public logistics story for v1?  
2. Approve **frontend1** as the only live marketing homepage until frontend2 copy is honest?  
3. Require **commit + Vercel cutover** before any external seller invite?  
4. Staff platform **Helpdesk** daily for soft launch, or delay public contact→ticket?  
5. Prioritize Brand Guard vs PayMongo live keys vs suspend enforcement next?

---

*Prepared for final engineering review — 2026-08-06.*
