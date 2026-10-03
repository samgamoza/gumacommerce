-- 0021_phase2_expand — Phase 2 core alignment, additive only (safe online).
-- See docs/PHASE-2-MIGRATION-SPEC.md. Nothing here changes existing data;
-- 0022 back-fills, and the NOT NULL / CHECK constraints come later (0023,
-- applied after the verification queries are clean).

DO $$ BEGIN
  CREATE TYPE "order_state" AS ENUM ('open', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "order_payment_state" AS ENUM ('unpaid', 'pending_verification', 'paid', 'cod_due', 'failed', 'refunded', 'partially_refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "fulfillment_state" AS ENUM ('unfulfilled', 'ready', 'booked', 'picked_up', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

-- ─── Locations (one default per shop in V1) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "name" varchar(120) NOT NULL,
  "address_line" text,
  "barangay" varchar(255),
  "city" varchar(255),
  "province" varchar(255),
  "psgc_code" varchar(20),
  "lat" numeric(10, 7),
  "lng" numeric(10, 7),
  "phone" varchar(20),
  "is_default" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_tenant_idx" ON "locations" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "locations_tenant_default_idx" ON "locations" USING btree ("tenant_id") WHERE "is_default";--> statement-breakpoint

-- ─── Orders: three statuses + acceptance/cancel facts + location ─────────────
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_state" "order_state";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_state" "order_payment_state";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_state" "fulfillment_state";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancel_reason" varchar(200);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "location_id" uuid REFERENCES "locations"("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tenant_states_idx" ON "orders" USING btree ("tenant_id", "order_state", "payment_state", "fulfillment_state");--> statement-breakpoint

-- History keeps the legacy status column (dual-write) and gains the new vocabulary.
ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "event" varchar(60);--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "from_state" text;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "to_state" text;--> statement-breakpoint

ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "location_id" uuid REFERENCES "locations"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "pickup_location_id" uuid REFERENCES "locations"("id") ON DELETE set null;--> statement-breakpoint

-- ─── Payment rows for every method ───────────────────────────────────────────
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "reference" varchar(120);--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "proof_url" text;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "verified_by" uuid REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "checkout_url" text;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "refund_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "failure_reason" varchar(255);--> statement-breakpoint

-- ─── Outbox on domain_events ─────────────────────────────────────────────────
ALTER TABLE "domain_events" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "domain_events" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_events" ADD COLUMN IF NOT EXISTS "next_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "domain_events" ADD COLUMN IF NOT EXISTS "last_error" text;--> statement-breakpoint
-- Everything already in the table was published at emit time (pre-outbox path).
UPDATE "domain_events" SET "published_at" = "created_at" WHERE "published_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domain_events_unpublished_idx" ON "domain_events" USING btree ("next_attempt_at") WHERE "published_at" IS NULL;--> statement-breakpoint

-- ─── Messaging: log of every send + opt-outs ────────────────────────────────
CREATE TABLE IF NOT EXISTS "message_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE cascade,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE set null,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE set null,
  "channel" varchar(20) NOT NULL,
  "recipient" varchar(255) NOT NULL,
  "recipe" varchar(80) NOT NULL,
  "step" integer DEFAULT 0 NOT NULL,
  "idempotency_key" varchar(255) NOT NULL,
  "status" varchar(20) DEFAULT 'queued' NOT NULL,
  "suppressed_reason" varchar(80),
  "provider" varchar(40),
  "provider_message_id" varchar(255),
  "body" text,
  "segments" integer,
  "cost_centavos" integer,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "sent_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  CONSTRAINT "message_log_channel_check" CHECK ("channel" IN ('sms', 'messenger', 'email', 'push')),
  CONSTRAINT "message_log_status_check" CHECK ("status" IN ('queued', 'sent', 'delivered', 'failed', 'suppressed'))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_log_idempotency_idx" ON "message_log" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_log_tenant_idx" ON "message_log" USING btree ("tenant_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_log_order_idx" ON "message_log" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_log_recipient_idx" ON "message_log" USING btree ("recipient", "created_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "messaging_opt_outs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "phone" varchar(20) NOT NULL,
  "channel" varchar(20) DEFAULT 'sms' NOT NULL,
  "scope" varchar(20) DEFAULT 'marketing' NOT NULL,
  -- NULL = every shop (SMS share one platform sender, decision D3).
  "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE cascade,
  "source" varchar(20) DEFAULT 'STOP' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "messaging_opt_outs_scope_check" CHECK ("scope" IN ('marketing', 'all'))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "messaging_opt_outs_unique_idx" ON "messaging_opt_outs" USING btree (
  "phone", "channel", "scope", coalesce("tenant_id", '00000000-0000-0000-0000-000000000000'::uuid)
);--> statement-breakpoint

-- ─── Consent ─────────────────────────────────────────────────────────────────
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "sms_marketing_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "sms_opt_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "sms_opt_in_source" varchar(40);--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN IF NOT EXISTS "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN IF NOT EXISTS "marketing_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN IF NOT EXISTS "recovery_sent_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN IF NOT EXISTS "last_recovery_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN IF NOT EXISTS "source_channel" varchar(50);--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN IF NOT EXISTS "utm_json" jsonb;
