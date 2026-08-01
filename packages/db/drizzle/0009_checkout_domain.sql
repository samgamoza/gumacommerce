ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "checkout_draft_json" jsonb;
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "checkout_published_json" jsonb;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tax" numeric(12, 2) DEFAULT '0';
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" varchar(64);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checkout_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "session_key" varchar(64) NOT NULL,
  "cart_json" jsonb,
  "customer_json" jsonb,
  "address_json" jsonb,
  "coupon_code" varchar(64),
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
  "abandoned_at" timestamp with time zone,
  "converted_order_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "checkout_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "checkout_sessions_tenant_key_idx" ON "checkout_sessions" USING btree ("tenant_id","session_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "checkout_sessions_status_idx" ON "checkout_sessions" USING btree ("tenant_id","status","last_activity_at");
