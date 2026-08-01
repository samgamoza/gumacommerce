DO $$ BEGIN
 CREATE TYPE "public"."wallet_ledger_type" AS ENUM('sale_credit', 'clearance_release', 'payout', 'refund_debit', 'adjustment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."wallet_ledger_status" AS ENUM('pending', 'available', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payout_status" AS ENUM('queued', 'processing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payout_method" AS ENUM('gcash', 'maya', 'bank');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"available_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_withdrawn" numeric(12, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"method" "payout_method" NOT NULL,
	"destination_account" varchar(64) NOT NULL,
	"destination_name" varchar(120) NOT NULL,
	"status" "payout_status" DEFAULT 'queued' NOT NULL,
	"auto_triggered" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid,
	"payout_id" uuid,
	"type" "wallet_ledger_type" NOT NULL,
	"status" "wallet_ledger_status" NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"fee_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(12, 2) NOT NULL,
	"description" text,
	"available_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_wallets" ADD CONSTRAINT "tenant_wallets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_payouts" ADD CONSTRAINT "tenant_payouts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_payout_id_tenant_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."tenant_payouts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_wallets_tenant_idx" ON "tenant_wallets" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_payouts_tenant_idx" ON "tenant_payouts" USING btree ("tenant_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_payouts_status_idx" ON "tenant_payouts" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_ledger_tenant_idx" ON "wallet_ledger_entries" USING btree ("tenant_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_ledger_order_sale_idx" ON "wallet_ledger_entries" USING btree ("order_id","type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_ledger_pending_idx" ON "wallet_ledger_entries" USING btree ("status","available_at");
