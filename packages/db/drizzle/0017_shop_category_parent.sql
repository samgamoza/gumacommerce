-- 0017_shop_category_parent — nested onboarding categories (vertical → subcategory)
ALTER TABLE "shop_business_categories" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shop_business_categories" ADD CONSTRAINT "shop_business_categories_parent_id_shop_business_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."shop_business_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shop_business_categories_parent_idx" ON "shop_business_categories" USING btree ("parent_id");
