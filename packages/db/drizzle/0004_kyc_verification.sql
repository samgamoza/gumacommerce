DO $$ BEGIN
 CREATE TYPE "public"."kyc_status" AS ENUM('draft', 'in_progress', 'submitted', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."kyc_id_path" AS ENUM('primary', 'secondary');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."kyc_doc_type" AS ENUM('primary_id', 'secondary_id_1', 'secondary_id_2', 'selfie');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_verification_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" "kyc_status" DEFAULT 'draft' NOT NULL,
	"id_path" "kyc_id_path",
	"primary_id_type" varchar(64),
	"secondary_id_type_1" varchar(64),
	"secondary_id_type_2" varchar(64),
	"rejection_reason" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"doc_type" "kyc_doc_type" NOT NULL,
	"id_category" varchar(64),
	"storage_key" varchar(512) NOT NULL,
	"mime_type" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_verification_sessions" ADD CONSTRAINT "kyc_verification_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_session_id_kyc_verification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."kyc_verification_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_sessions_token_idx" ON "kyc_verification_sessions" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kyc_sessions_tenant_idx" ON "kyc_verification_sessions" USING btree ("tenant_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_documents_session_type_idx" ON "kyc_documents" USING btree ("session_id","doc_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kyc_documents_tenant_idx" ON "kyc_documents" USING btree ("tenant_id");
