ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_main" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_tenant_main_idx" ON "products" USING btree ("tenant_id","is_main");--> statement-breakpoint
-- At most one main identity product per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS "products_tenant_one_main_idx"
  ON "products" ("tenant_id")
  WHERE "is_main" = true;
