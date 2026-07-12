# Guma Commerce

AI-powered social commerce platform for Philippine sellers. Replace fragmented Messenger chats with branded mobile storefronts, local payments, and delivery integration.

## Monorepo structure

```
guma-commerce/
├── apps/
│   ├── web/          # Customer storefront (port 3010 in dev)
│   └── admin/        # Seller dashboard + AI studio (port 3001)
│   └── platform/     # Super-admin console (port 3002)
├── packages/
│   ├── db/           # Drizzle ORM schema + migrations
│   ├── ai/           # AI prompt templates + generator
│   ├── services/     # PayMongo, Lalamove, SMS integrations
│   └── ui/           # Shared UI components
```

## Database setup

**Production (recommended):** Neon Postgres — see **[docs/DATABASE.md](docs/DATABASE.md)** for full setup.

Quick Neon steps:
1. Create project at [console.neon.tech](https://console.neon.tech) (region: Singapore)
2. Paste **direct** + **pooled** URLs into `.env`
3. Run `pnpm db:migrate && pnpm db:seed`

**Local Docker (offline dev):**

```bash
pnpm db:up
pnpm db:push        # or db:migrate on fresh DB
pnpm db:seed
```

- **Storefront:** http://localhost:3010
- **Admin:** http://localhost:3001
- **Platform:** http://localhost:3002
- **Demo shop:** http://localhost:3010/demo
- **Template demos:** http://localhost:3010/waggy-demo, `/fruitables-demo`, `/ministore-demo`, etc.

## Key features (MVP scaffold)

- Multi-tenant storefront routing (`/{seller-slug}`)
- Seller admin dashboard with Guma-style AI campaign studio & agentic ops
- Drizzle schema for catalog, orders, payments, delivery
- PayMongo payment intent stubs + webhook handler
- Lalamove quotation + booking stubs
- AI prompt templates (TikTok, FB/IG, product listings, campaigns)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema to database (local only) |
| `pnpm db:migrate` | Apply migrations (production-safe) |
| `pnpm db:studio` | Open Drizzle Studio |

## Deployment

Deploy `apps/web` and `apps/admin` to Vercel. See **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)** for pre-beta checklist, env vars, and cron setup.

**Agent handoff:** **[docs/COMPREHENSIVE-HANDOFF-2026-07-12.md](docs/COMPREHENSIVE-HANDOFF-2026-07-12.md)** — full repo summary.  
**Constitution:** **[docs/CONSTITUTION.md](docs/CONSTITUTION.md)** · **Architecture:** **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Session notes: **[docs/AGENT-HANDOFF.md](docs/AGENT-HANDOFF.md)**.

**GUMA Launch (new):** after signup → http://localhost:3001/launch

Set environment variables from `.env.example`.

## Compliance

See platform plan for NPC/DPA, RA 11967, and Semaphore sender ID registration requirements before production launch.
