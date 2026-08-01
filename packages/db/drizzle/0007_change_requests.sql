-- Crown Jewel: change_requests + tenant-scoped audit columns
DO $$ BEGIN
  CREATE TYPE "public"."change_request_domain" AS ENUM('theme', 'pricing', 'catalog', 'seo', 'checkout', 'shipping');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."change_request_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'published', 'rolled_back');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."actor_type" AS ENUM('user', 'ai', 'system');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "platform_audit_log" ADD COLUMN IF NOT EXISTS "tenant_id" uuid;
ALTER TABLE "platform_audit_log" ADD COLUMN IF NOT EXISTS "actor_type" "actor_type" DEFAULT 'user';

DO $$ BEGIN
  ALTER TABLE "platform_audit_log"
    ADD CONSTRAINT "platform_audit_log_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "platform_audit_tenant_idx" ON "platform_audit_log" ("tenant_id", "created_at");

CREATE TABLE IF NOT EXISTS "change_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "domain" "change_request_domain" NOT NULL,
  "status" "change_request_status" DEFAULT 'draft' NOT NULL,
  "scope" varchar(60) NOT NULL,
  "approval_level" varchar(20) NOT NULL,
  "proposed_by_type" "actor_type" NOT NULL,
  "proposed_by_user_id" uuid,
  "ai_generation_id" uuid,
  "summary" varchar(255),
  "before_json" jsonb,
  "after_json" jsonb,
  "reviewed_by" uuid,
  "reviewed_at" timestamptz,
  "review_note" text,
  "published_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "change_requests"
    ADD CONSTRAINT "change_requests_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "change_requests"
    ADD CONSTRAINT "change_requests_proposed_by_user_id_users_id_fk"
    FOREIGN KEY ("proposed_by_user_id") REFERENCES "public"."users"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "change_requests"
    ADD CONSTRAINT "change_requests_ai_generation_id_ai_generations_id_fk"
    FOREIGN KEY ("ai_generation_id") REFERENCES "public"."ai_generations"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "change_requests"
    ADD CONSTRAINT "change_requests_reviewed_by_users_id_fk"
    FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "change_requests_tenant_idx" ON "change_requests" ("tenant_id");
CREATE INDEX IF NOT EXISTS "change_requests_status_idx" ON "change_requests" ("status");
CREATE INDEX IF NOT EXISTS "change_requests_tenant_status_idx" ON "change_requests" ("tenant_id", "status");
