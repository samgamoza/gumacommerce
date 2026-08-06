-- 0014_template_intelligence — ops-managed onboarding categories + template stock
CREATE TYPE "public"."shop_category_status" AS ENUM('enabled', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."template_stock_status" AS ENUM('draft', 'approved', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."template_stock_source" AS ENUM('free_bundle', 'ops_manual', 'ai_curated');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shop_business_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"label" varchar(120) NOT NULL,
	"status" "shop_category_status" DEFAULT 'enabled' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"min_variants" integer DEFAULT 3 NOT NULL,
	"target_variants" integer DEFAULT 5 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shop_business_categories_slug_idx" ON "shop_business_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shop_business_categories_label_idx" ON "shop_business_categories" USING btree ("label");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shop_business_categories_status_sort_idx" ON "shop_business_categories" USING btree ("status","sort_order");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_key" varchar(80) NOT NULL,
	"label" varchar(160) NOT NULL,
	"category_id" uuid,
	"category_label" varchar(120) NOT NULL,
	"live_template_id" varchar(64) NOT NULL,
	"status" "template_stock_status" DEFAULT 'draft' NOT NULL,
	"source" "template_stock_source" DEFAULT 'ops_manual' NOT NULL,
	"source_ref" varchar(120),
	"notes" text,
	"preview_image_url" text,
	"store_look_json" jsonb,
	"created_by_user_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_stock" ADD CONSTRAINT "template_stock_category_id_shop_business_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."shop_business_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "template_stock_key_idx" ON "template_stock" USING btree ("stock_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_stock_category_status_idx" ON "template_stock" USING btree ("category_label","status");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_intelligence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"category_label" varchar(120),
	"stock_key" varchar(80),
	"tenant_id" uuid,
	"payload_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_intelligence_events_type_idx" ON "template_intelligence_events" USING btree ("event_type","created_at");
