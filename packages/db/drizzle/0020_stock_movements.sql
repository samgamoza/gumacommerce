-- 0020_stock_movements — Phase 1: append-only stock ledger.
-- Every change to product_variants.stock_qty writes one row here (sale,
-- restock on cancel/refund/expiry, seller adjustment). Back-fills an "initial"
-- row per variant so sum(delta) reconciles with stock_qty from today on.
DO $$ BEGIN
  CREATE TYPE "stock_movement_reason" AS ENUM ('initial', 'sale', 'restock_cancel', 'restock_refund', 'restock_expiry', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "variant_id" uuid NOT NULL REFERENCES "product_variants"("id") ON DELETE cascade,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE set null,
  "reason" "stock_movement_reason" NOT NULL,
  "delta" integer NOT NULL,
  "balance_after" integer,
  "note" varchar(200),
  "actor_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "stock_movements_delta_nonzero" CHECK ("delta" <> 0)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_variant_idx" ON "stock_movements" USING btree ("variant_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_tenant_idx" ON "stock_movements" USING btree ("tenant_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_order_idx" ON "stock_movements" USING btree ("order_id");--> statement-breakpoint
-- A given order moves a given variant at most once per reason (sale / one restock).
CREATE UNIQUE INDEX IF NOT EXISTS "stock_movements_order_variant_reason_idx"
  ON "stock_movements" USING btree ("order_id", "variant_id", "reason") WHERE "order_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "stock_movements" ("tenant_id", "variant_id", "reason", "delta", "balance_after", "note")
SELECT p."tenant_id", v."id", 'initial', v."stock_qty", v."stock_qty", 'Opening balance when the ledger started'
FROM "product_variants" v
JOIN "products" p ON p."id" = v."product_id"
WHERE p."track_inventory" = true
  AND coalesce(v."stock_qty", 0) <> 0
  AND NOT EXISTS (SELECT 1 FROM "stock_movements" m WHERE m."variant_id" = v."id");
