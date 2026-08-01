CREATE TYPE "public"."agent_run_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."agent_schedule" AS ENUM('daily', 'weekly', 'manual');--> statement-breakpoint
CREATE TYPE "public"."content_platform" AS ENUM('instagram', 'tiktok', 'facebook', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."content_queue_status" AS ENUM('draft', 'approved', 'scheduled', 'posted', 'skipped');--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agent_key" varchar(50) NOT NULL,
	"status" "agent_run_status" DEFAULT 'running' NOT NULL,
	"items_created" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_usage_monthly" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period_month" varchar(7) NOT NULL,
	"generations" integer DEFAULT 0 NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agent_key" varchar(50) NOT NULL,
	"platform" "content_platform" NOT NULL,
	"title" varchar(255),
	"body" text NOT NULL,
	"media_brief" text,
	"status" "content_queue_status" DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"output_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_monthly" ADD CONSTRAINT "ai_usage_monthly_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_queue" ADD CONSTRAINT "content_queue_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_chat_messages" ADD CONSTRAINT "shop_chat_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_runs_tenant_idx" ON "agent_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_tenant_month_idx" ON "ai_usage_monthly" USING btree ("tenant_id","period_month");--> statement-breakpoint
CREATE INDEX "content_queue_tenant_idx" ON "content_queue" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "content_queue_status_idx" ON "content_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shop_chat_tenant_session_idx" ON "shop_chat_messages" USING btree ("tenant_id","session_id");--> statement-breakpoint
CREATE INDEX "shop_chat_tenant_created_idx" ON "shop_chat_messages" USING btree ("tenant_id","created_at");