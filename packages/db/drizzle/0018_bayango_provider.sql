-- 0018_bayango_provider — BayanGo becomes a bookable delivery provider (Partner API v1).
-- Additive enum change; safe to run on a live database.
ALTER TYPE "public"."delivery_provider" ADD VALUE IF NOT EXISTS 'bayango';
