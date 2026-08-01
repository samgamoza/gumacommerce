ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "shipping_draft_json" jsonb;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "shipping_published_json" jsonb;
