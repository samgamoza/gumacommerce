# Delivery couriers + Helpdesk

## Delivery

Connected apps:

| Provider | Checkout live quote | Book from Orders | Webhook | Notes |
|----------|---------------------|------------------|---------|-------|
| **Lalamove** | Yes (preferred or failover) | Yes via orchestrator | `/api/webhooks/lalamove` | Requires API key + pickup address |
| **GrabExpress** | Yes (preferred or failover) | Yes via orchestrator | `/api/webhooks/grab` | Requires Grab partner credentials |
| **Manual / Angkas / Move It / own rider** | Flat fee | **Assign rider** UI + optional Book (self-delivery row) | n/a | No partner API |

Seller settings → Delivery & Shipping:

- Choose preferred provider (`lalamove` / `grab` / `manual`)
- Set pickup address for live courier quotes
- Flat fee remains the checkout fallback

Book flow (`POST /api/orders/:id/book-delivery`) uses `dispatch()` with failover:
preferred → other live courier → manual.

## Helpdesk

Ticketed support (separate from buyer↔seller shop chat):

| Surface | Role |
|---------|------|
| `apps/web` `/contact` | Public intake → creates ticket |
| `apps/admin` Settings → Help & support | Seller tickets + updates |
| `apps/platform` `/helpdesk` | Agent queue, SLA, assign, reply, internal notes |

SLA clocks (from create):

- First response: 4 hours
- Resolve: 48 hours

Email notifications (Resend — optional, fail-closed):

- New ticket (web `/contact` or admin Help & support) → `HELPDESK_NOTIFY_EMAIL`
- Agent reply (platform `/helpdesk`, non-internal) → ticket `requesterEmail`
- Env: `RESEND_API_KEY`, `EMAIL_FROM`, `HELPDESK_NOTIFY_EMAIL`, `NEXT_PUBLIC_PLATFORM_URL`
- Missing config: ticket writes still succeed; email reports `sent: false` (never fake success in production). Health: `/api/health/integrations` → `email`.

Migration: `packages/db/drizzle/0013_support_helpdesk.sql` — run `pnpm db:migrate`.
