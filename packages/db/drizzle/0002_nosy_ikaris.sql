CREATE TABLE IF NOT EXISTS "plan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PHP' NOT NULL,
	"gateway" "payment_gateway" DEFAULT 'paymongo' NOT NULL,
	"gateway_intent_id" varchar(255),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"period_days" integer DEFAULT 30 NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"action" varchar(80) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" uuid,
	"entity_label" varchar(255),
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "orders_number_idx";--> statement-breakpoint
ALTER TABLE "content_queue" ADD COLUMN IF NOT EXISTS "flagged" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content_queue" ADD COLUMN IF NOT EXISTS "moderation_note" text;--> statement-breakpoint
ALTER TABLE "content_queue" ADD COLUMN IF NOT EXISTS "moderated_by" uuid;--> statement-breakpoint
ALTER TABLE "content_queue" ADD COLUMN IF NOT EXISTS "moderated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_plate_number" varchar(20);--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_lat" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_lng" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_location_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "next_order_seq" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plan_payments" ADD CONSTRAINT "plan_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_audit_log" ADD CONSTRAINT "platform_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "plan_payments_intent_idx" ON "plan_payments" USING btree ("gateway_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_payments_tenant_idx" ON "plan_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_audit_actor_idx" ON "platform_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_audit_created_idx" ON "platform_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_audit_entity_idx" ON "platform_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_tenant_idx" ON "push_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_queue" ADD CONSTRAINT "content_queue_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_queue_flagged_idx" ON "content_queue" USING btree ("flagged");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deliveries_order_idx" ON "deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deliveries_provider_order_idx" ON "deliveries" USING btree ("provider_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_quotes_order_idx" ON "delivery_quotes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_tenant_number_idx" ON "orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tenant_created_idx" ON "orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_product_idx" ON "product_variants" USING btree ("product_id");