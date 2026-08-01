-- 0011_customers — Shop CRM: buyer identity by phone (Customer entity).
-- Additive + idempotent: safe to run against a DB that may be partially migrated.
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phone" varchar(20) NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"first_order_at" timestamp with time zone,
	"last_order_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_record_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_tenant_id_tenants_id_fk') THEN
		ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_record_id_customers_id_fk') THEN
		ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_record_id_customers_id_fk" FOREIGN KEY ("customer_record_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenant_phone_idx" ON "customers" USING btree ("tenant_id","phone");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_tenant_last_order_idx" ON "customers" USING btree ("tenant_id","last_order_at");
