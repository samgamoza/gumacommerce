CREATE TYPE "public"."ph_location_kind" AS ENUM('province', 'city', 'barangay');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ph_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"psgc_code" varchar(20) NOT NULL,
	"kind" "ph_location_kind" NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_normalized" varchar(255) NOT NULL,
	"province_code" varchar(10) NOT NULL,
	"province_name" varchar(255) NOT NULL,
	"city_code" varchar(20),
	"city_name" varchar(255)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ph_locations_psgc_idx" ON "ph_locations" USING btree ("psgc_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ph_locations_kind_name_idx" ON "ph_locations" USING btree ("kind","name_normalized");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ph_locations_province_city_idx" ON "ph_locations" USING btree ("kind","province_code","city_code","name_normalized");
