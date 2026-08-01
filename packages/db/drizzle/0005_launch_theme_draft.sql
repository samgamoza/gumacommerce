-- Phase 1: GUMA Launch — Store DNA + theme draft/publish
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "store_dna_json" jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "theme_draft_json" jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "theme_published_json" jsonb;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customization_version" integer DEFAULT 1 NOT NULL;

-- Backfill published from legacy theme_json so live shops keep working
UPDATE "tenants"
SET "theme_published_json" = "theme_json"
WHERE "theme_published_json" IS NULL AND "theme_json" IS NOT NULL;

UPDATE "tenants"
SET "theme_draft_json" = COALESCE("theme_draft_json", "theme_json")
WHERE "theme_draft_json" IS NULL AND "theme_json" IS NOT NULL;
