ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "seo_draft_json" jsonb;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "seo_published_json" jsonb;
