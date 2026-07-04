# Database Setup — Production-Ready PostgreSQL

Guma Commerce uses **PostgreSQL** with **Drizzle ORM**. For deployment, we recommend **[Neon](https://neon.tech)** — serverless Postgres with a free tier, connection pooling, and first-class Vercel integration.

## Why Neon?

| Feature | Benefit |
|---------|---------|
| Managed Postgres | No server maintenance |
| Connection pooler | Safe for Vercel/serverless |
| Branching | Separate dev/staging/prod databases |
| Asia-Pacific regions | Lower latency for PH users (Singapore) |
| Free tier | Enough for MVP + early growth |

Alternatives that also work: **Supabase**, **Railway**, **AWS RDS**.

---

## Neon ↔ Vercel integration (automatic env vars)

If you connected Neon to Vercel + GitHub, **Vercel already has your DB credentials**. Neon uses **different variable names** than manual setup:

| Vercel env var (auto-injected) | Connection type | Used for |
|-------------------------------|-----------------|----------|
| `DATABASE_URL` | **Pooled** (`-pooler` in host) | App at runtime |
| `DATABASE_URL_UNPOOLED` | **Direct** (no `-pooler`) | Migrations, seed |

Guma Commerce supports both this and manual `.env` naming. **You don't need to paste strings into Vercel manually.**

To run migrations from your PC, copy `DATABASE_URL_UNPOOLED` from Vercel → Settings → Environment Variables into a local `.env`, then run `pnpm db:migrate`.

---

## Step 1 — Create a Neon project

1. Sign up at [console.neon.tech](https://console.neon.tech)
2. Click **New Project**
3. Name: `guma-commerce`
4. Region: **AWS Singapore (`ap-southeast-1`)** — closest to Philippines
5. Postgres version: **16**

---

## Step 2 — Copy connection strings

In Neon Console → your project → **Connect**:

| String | Use for | Hostname pattern |
|--------|---------|------------------|
| **Direct connection** | Migrations, Drizzle Studio | `ep-xxxx.ap-southeast-1.aws.neon.tech` |
| **Pooled connection** | App runtime (Vercel) | `ep-xxxx-**pooler**.ap-southeast-1.aws.neon.tech` |

Enable **SSL** (required).

---

## Step 3 — Configure `.env`

Open `.env` in the project root and set:

```env
# Direct — for migrations & Drizzle Studio (NOT pooler)
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Pooled — for Next.js app at runtime
DATABASE_URL_POOLED=postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Replace `USER`, `PASSWORD`, and host with values from Neon Console.

> **Important:** Never commit `.env` to git. Set the same variables in Vercel → Project Settings → Environment Variables.

---

## Step 4 — Apply schema & seed data

From the project root:

```cmd
pnpm install
pnpm db:migrate
pnpm db:seed
```

| Command | What it does |
|---------|--------------|
| `pnpm db:migrate` | Applies versioned SQL migrations (production-safe) |
| `pnpm db:reconcile` | Records migration 0001 if agent tables exist from a partial `db:push` |
| `pnpm db:seed` | Inserts demo tenant + products |
| `pnpm db:studio` | Opens Drizzle Studio GUI |
| `pnpm db:generate` | Generate new migration after schema changes |

For rapid local-only prototyping you can still use `pnpm db:push`, but **use migrations for anything you deploy**.

---

## Step 5 — Deploy to Vercel

1. Push repo to GitHub
2. Import both apps in Vercel:
   - `apps/web` → `gumacommerce.ph` storefront
   - `apps/admin` → `app.gumacommerce.ph` dashboard
3. Add environment variables to **both** projects:

```
DATABASE_URL=postgresql://...direct...
DATABASE_URL_POOLED=postgresql://...pooler...
```

4. Optional: install [Neon Vercel Integration](https://neon.tech/docs/guides/vercel) to auto-sync env vars

Full pre-beta checklist: **[DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)**

### CI migration (recommended)

Add to your deploy pipeline **before** the app build:

```bash
pnpm db:migrate
```

Or run migrations manually after each schema change:

```cmd
pnpm db:migrate
```

---

## Environment strategy

| Environment | Database | How |
|-------------|----------|-----|
| **Local dev** | Docker Postgres OR Neon dev branch | `.env` |
| **Preview** | Neon branch per PR (optional) | Vercel preview env |
| **Production** | Neon main branch | Vercel production env |

Neon **branching** lets you create `dev` and `staging` branches from production without separate projects.

---

## Local Docker (optional fallback)

If you prefer local Postgres while developing offline:

```cmd
pnpm db:up
```

Uses port **5434** (avoids conflict with existing Postgres on 5432/5433):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/guma_commerce
# DATABASE_URL_POOLED can be the same for local
DATABASE_URL_POOLED=postgresql://postgres:postgres@localhost:5434/guma_commerce
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `DATABASE_URL is missing` | Create `.env` from `.env.example` |
| `password authentication failed` | Wrong port — another Postgres may be on 5432; use Neon URLs or Docker on 5434 |
| `connection pool exhausted` | Use `DATABASE_URL_POOLED` in app, direct URL only for migrations |
| Migrations fail on Neon | Ensure you're using the **direct** (non-pooler) URL for `DATABASE_URL` |
| `type "agent_run_status" already exists` | Agent tables created via `db:push`; run `pnpm db:reconcile` then `pnpm db:migrate` |

---

## Schema changes workflow

1. Edit `packages/db/src/schema/index.ts`
2. Run `pnpm db:generate` — creates SQL in `packages/db/drizzle/`
3. Review the generated migration
4. Run `pnpm db:migrate` locally
5. Commit migration files to git
6. Deploy — migrations run against production Neon
