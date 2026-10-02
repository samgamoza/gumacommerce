-- 0019_order_access_and_restock — Phase 1 stabilization.
-- 1) Buyer order links need an unguessable token (order numbers are sequential).
-- 2) stock_restored_at makes restocking on cancel/refund/expiry idempotent.
-- gen_random_uuid() is built into Postgres 13+, so no extension is needed.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "access_token" varchar(64);--> statement-breakpoint
UPDATE "orders"
  SET "access_token" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  WHERE "access_token" IS NULL;--> statement-breakpoint
ALTER TABLE "orders"
  ALTER COLUMN "access_token" SET DEFAULT (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "access_token" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_access_token_idx" ON "orders" USING btree ("access_token");--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stock_restored_at" timestamp with time zone;
