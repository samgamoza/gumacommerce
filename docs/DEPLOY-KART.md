# Deploying the storefront to Cloudflare Workers (kart.guma.one)

`apps/web` (the storefront **and** the new `/kart` revamp) runs on Cloudflare Workers through
[OpenNext](https://opennext.js.org/cloudflare). Admin (`admin.guma.one`) and Platform
(`ops.guma.one`) are unchanged and stay on the Proxmox tunnel; `deploy.ps1` still targets CT 106.

## One command

```powershell
cd "D:\All Apps\gumacommerce"
.\scripts\deploy-kart.ps1          # -SkipInstall / -SkipSecrets for quick re-deploys
```

It needs, in `.env`: `DATABASE_URL` (Neon pooled), the integration keys you already keep there, and
`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` (it falls back to the Kuya Eddie repo's `.env`).
The token needs **Workers Scripts:Edit, Workers R2 Storage:Edit, Workers Routes:Edit, DNS:Edit, Zone:Read**.

## Files

| File | Purpose |
|---|---|
| `apps/web/wrangler.jsonc` | Worker `gumakart-web`, `nodejs_compat`, static assets, custom domain `kart.guma.one`, R2 binding `UPLOADS` → bucket `gumakart-uploads` |
| `apps/web/open-next.config.ts` | OpenNext config (default cache) |
| `apps/web/lib/r2-uploads.ts` | R2 read/write helpers; used by the payment-proof upload and the two `/uploads/...` serve routes. Off Workers the binding is absent and the old disk paths are used. |
| `scripts/deploy-kart.ps1` | build + deploy + secrets + smoke test |

## Things to know

- **Uploads.** Workers have no disk. Payment proofs now go to R2 (`payment-proofs/<slug>/<order>/<file>`) and are served from it at the same `/uploads/...` URLs. **Product photos** are uploaded by the *admin* app (still on CT 106) into its disk, so on kart.guma.one they must exist in R2 under `products/<tenantId>/<file>`. One-time copy from the CT:
  ```bash
  # on pve, inside CT 106 (needs rclone with an R2 remote, or wrangler + R2 API token)
  npx wrangler r2 object put gumakart-uploads/products/<tenantId>/<file> --file=/root/guma/apps/web/public/uploads/products/<tenantId>/<file>
  ```
  Long-term fix: make the admin upload write to R2 too (same helper).
- **Database.** `postgres` (postgres.js) works on Workers with `nodejs_compat`; `DATABASE_URL` must be the Neon **pooled** URL. Cold starts open a new connection per isolate.
- **Inngest / crons.** Inngest is only invoked from admin; nothing changes here.
- **Fonts.** `next/font/google` fetches at build time — the machine running the build needs internet. (Claude's sandbox used `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` to validate the build offline; not needed on your PC.)
- **Rollback.** The tunnel hostname `commerce.guma.one` still points at CT 106; kart.guma.one is a separate custom domain on the Worker. Deleting the Worker's custom domain (Workers & Pages → gumakart-web → Settings → Domains) takes kart.guma.one down without touching anything else.
