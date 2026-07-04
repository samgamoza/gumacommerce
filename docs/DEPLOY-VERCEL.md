# Pre-beta deploy on Vercel

Deploy **two** Vercel projects from this monorepo. Target: preview today, production tomorrow.

## 1. Database (Neon)

1. Use existing Neon project (Singapore region).
2. Connect Neon ↔ Vercel integration so both apps get `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct).
3. From your machine (with `DATABASE_URL_UNPOOLED` in `.env`):

```cmd
pnpm install
pnpm db:migrate
pnpm db:reconcile
pnpm db:seed
```

| Command | When |
|---------|------|
| `pnpm db:migrate` | Fresh DB or new migration files |
| `pnpm db:reconcile` | Only if agent tables exist but migration 0001 wasn't recorded (partial `db:push`) |
| `pnpm db:seed` | Demo tenant for smoke tests |

See [DATABASE.md](./DATABASE.md) for troubleshooting.

## 2. Vercel projects

| Project | Root directory | Domain (example) |
|---------|----------------|------------------|
| Storefront | `apps/web` | `guma.ph` or `*.vercel.app` |
| Admin | `apps/admin` | `app.guma.ph` or `*-admin.vercel.app` |

**Framework:** Next.js (auto-detected)

**Build command (both):**

```bash
cd ../.. && pnpm install && pnpm turbo build --filter=@guma-commerce/web
```

Replace filter with `@guma-commerce/admin` for the admin project.

**Install command:** `pnpm install` (run from repo root via `cd ../..` in build if needed)

**Node.js:** 20.x

## 3. Environment variables

Set on **both** projects unless noted.

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Pooled (Neon auto) |
| `DATABASE_URL_UNPOOLED` | Admin optional | Direct URL for local migrations only |
| `AUTH_SECRET` | Yes | 32+ random chars |
| `NEXT_PUBLIC_STOREFRONT_URL` | Yes | Production storefront URL |
| `NEXT_PUBLIC_ADMIN_URL` | Yes | Production admin URL |
| `GOOGLE_CLIENT_ID` | Yes for login | Add prod callback URI in Google Console |
| `GOOGLE_CLIENT_SECRET` | Yes for login | |
| `CRON_SECRET` | Admin only | Vercel Cron sends `Authorization: Bearer …` |
| `GEMINI_API_KEY` | Recommended | Free-tier agents + chat |
| `OPENAI_API_KEY` | Growth/Pro | Better models on paid plans |
| `SEMAPHORE_API_KEY` | Optional | SMS queue reminders (Growth+) |

Copy from [.env.example](../.env.example).

## 4. Cron jobs (admin project)

`apps/admin/vercel.json` defines:

| Schedule (UTC) | Path | Purpose |
|----------------|------|---------|
| `0 10 * * *` | `/api/cron/agents?mode=daily` | Daily posting agent (~6 PM PHT) |
| `0 2 * * 1` | `/api/cron/agents?mode=weekly` | Weekly campaign agent |
| `0 9 * * *` | `/api/cron/agent-reminders` | SMS nudge when drafts waiting |

Requires **Vercel Pro** for cron on Hobby limits may apply — check your plan.

Set `CRON_SECRET` in admin env; Vercel attaches it to cron requests automatically.

## 5. Google OAuth production

In Google Cloud Console → Credentials → OAuth client:

- Authorized redirect URI: `https://YOUR-ADMIN-DOMAIN/api/auth/google/callback`
- Authorized JavaScript origins: `https://YOUR-ADMIN-DOMAIN`

## 6. Pre-beta smoke test

After deploy:

1. **Storefront** — open `/{demo}` or your tenant slug; shop assistant bubble works.
2. **Admin login** — Google OAuth → dashboard loads.
3. **Agents** (`/agents`) — daily briefing shows order stats; usage meters render.
4. **Run daily posts** — creates queue items (needs `GEMINI_API_KEY` or mock fallback).
5. **Quota** — free plan blocks after weekly limit with upgrade message.
6. **Cron** (optional manual):  
   `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-ADMIN/api/cron/agents?mode=daily`

## 7. What is intentionally out of scope for pre-beta

- Meta/TikTok OAuth auto-publish
- Unified Messenger inbox
- Production payment go-live (PayMongo live keys)

## 8. Deploy order (today → tomorrow)

**Today (preview):**

1. Push branch to GitHub
2. Import `apps/web` + `apps/admin` on Vercel (preview deploys)
3. Run `pnpm db:migrate` against Neon
4. Set env vars on preview
5. Smoke test preview URLs

**Tomorrow (production):**

1. Point domains at Vercel projects
2. Copy env vars to Production environment
3. Run migrate if any schema changes landed overnight
4. Enable cron on admin production deploy
5. Invite 2–3 pilot sellers
