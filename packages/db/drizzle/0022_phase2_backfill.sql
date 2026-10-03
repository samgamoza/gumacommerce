-- 0022_phase2_backfill — map every existing order onto the three statuses
-- (docs/PHASE-2-MIGRATION-SPEC.md §3). Idempotent: only touches rows that
-- haven't been mapped yet, so it can safely re-run.

-- 1) One default location per shop, seeded from the delivery pickup address.
INSERT INTO "locations" ("tenant_id", "name", "address_line", "is_default", "is_active")
SELECT t."id", 'Main store', nullif(trim(t."settings_json"->'delivery'->>'pickupAddress'), ''), true, true
FROM "tenants" t
WHERE NOT EXISTS (SELECT 1 FROM "locations" l WHERE l."tenant_id" = t."id" AND l."is_default");--> statement-breakpoint

-- 2) Order states from the legacy status, payment status and deliveries.
UPDATE "orders" o SET
  "payment_state" = (CASE
    WHEN o."status" = 'refunded' OR o."payment_status" = 'refunded' THEN 'refunded'
    WHEN o."status" = 'delivered' THEN 'paid'                      -- delivered COD = collected
    WHEN o."payment_status" = 'paid' THEN 'paid'
    WHEN o."payment_status" = 'failed' THEN 'failed'
    WHEN o."status" = 'cancelled' THEN 'unpaid'
    WHEN o."payment_method" = 'cod' THEN 'cod_due'
    WHEN EXISTS (SELECT 1 FROM "payment_transactions" p WHERE p."order_id" = o."id" AND p."status" = 'processing')
      THEN 'pending_verification'
    ELSE 'unpaid'
  END)::"order_payment_state",
  "fulfillment_state" = (CASE
    WHEN o."status" = 'ready_for_pickup' THEN 'ready'
    WHEN o."status" = 'out_for_delivery' THEN 'out_for_delivery'
    WHEN o."status" = 'delivered' THEN 'delivered'
    WHEN o."status" = 'refunded' AND (
      o."completed_at" IS NOT NULL
      OR EXISTS (SELECT 1 FROM "order_status_history" h WHERE h."order_id" = o."id" AND h."status" = 'delivered')
    ) THEN 'delivered'
    WHEN o."status" IN ('accepted', 'preparing') AND EXISTS (
      SELECT 1 FROM "deliveries" d
      WHERE d."order_id" = o."id" AND d."provider_order_id" IS NOT NULL
        AND coalesce(lower(d."status"), '') NOT IN ('cancelled', 'canceled', 'rejected', 'expired', 'failed')
    ) THEN 'booked'
    ELSE 'unfulfilled'
  END)::"fulfillment_state",
  "order_state" = (CASE
    WHEN o."status" IN ('cancelled', 'refunded') THEN 'cancelled'
    WHEN o."status" = 'delivered' THEN 'completed'
    ELSE 'open'
  END)::"order_state",
  "accepted_at" = CASE
    WHEN o."status" IN ('accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered') THEN coalesce(
      (SELECT min(h."created_at") FROM "order_status_history" h WHERE h."order_id" = o."id" AND h."status" = 'accepted'),
      o."created_at")
    ELSE NULL
  END,
  "cancelled_at" = CASE
    WHEN o."status" IN ('cancelled', 'refunded') THEN coalesce(
      (SELECT max(h."created_at") FROM "order_status_history" h WHERE h."order_id" = o."id" AND h."status" IN ('cancelled', 'refunded')),
      o."created_at")
    ELSE NULL
  END,
  "location_id" = coalesce(o."location_id",
    (SELECT l."id" FROM "locations" l WHERE l."tenant_id" = o."tenant_id" AND l."is_default" LIMIT 1)),
  "source_channel" = coalesce(nullif(o."source_channel", ''), 'storefront')
WHERE o."order_state" IS NULL;--> statement-breakpoint

-- 3) Legacy columns become a pure function of the new ones (dual-write source
--    of truth from here on). Only effect on old data: "preparing" → "accepted"
--    (no separate state any more) and pre-Phase-1 delivered COD → paid.
--    Keep this CASE identical to legacyStatusOf() in queries/order-state.ts.
UPDATE "orders" o SET
  "status" = (CASE
    WHEN o."order_state" = 'cancelled' AND o."payment_state" = 'refunded' THEN 'refunded'
    WHEN o."order_state" = 'cancelled' THEN 'cancelled'
    WHEN o."order_state" = 'completed' THEN 'delivered'
    WHEN o."fulfillment_state" = 'delivered' THEN 'delivered'
    WHEN o."fulfillment_state" IN ('picked_up', 'out_for_delivery', 'failed_delivery', 'returned') THEN 'out_for_delivery'
    WHEN o."fulfillment_state" = 'ready' THEN 'ready_for_pickup'
    WHEN o."accepted_at" IS NOT NULL THEN 'accepted'
    WHEN o."payment_state" = 'paid' THEN 'paid'
    WHEN o."payment_state" = 'cod_due' THEN 'accepted'
    ELSE 'pending_payment'
  END)::"order_status",
  "payment_status" = (CASE o."payment_state"
    WHEN 'paid' THEN 'paid'
    WHEN 'failed' THEN 'failed'
    WHEN 'refunded' THEN 'refunded'
    WHEN 'partially_refunded' THEN 'refunded'
    ELSE 'pending'
  END)::"payment_status"
WHERE o."order_state" IS NOT NULL;--> statement-breakpoint

-- 4) Payment rows: copy manual fields out of raw_webhook_json, then make sure
--    every order has a charge row (COD orders often had none).
UPDATE "payment_transactions" p SET
  "reference" = coalesce(p."reference", nullif(p."raw_webhook_json"->>'buyerReference', '')),
  "proof_url" = coalesce(p."proof_url", nullif(p."raw_webhook_json"->>'proofUrl', '')),
  "checkout_url" = coalesce(p."checkout_url", nullif(p."raw_webhook_json"->>'checkoutUrl', ''))
WHERE p."raw_webhook_json" IS NOT NULL
  AND (p."reference" IS NULL AND p."proof_url" IS NULL AND p."checkout_url" IS NULL);--> statement-breakpoint

INSERT INTO "payment_transactions" ("order_id", "tenant_id", "gateway", "gateway_intent_id", "amount", "status", "method_type", "paid_at")
SELECT o."id", o."tenant_id",
  (CASE WHEN o."payment_method" = 'cod' THEN 'cod' ELSE 'manual' END)::"payment_gateway",
  (CASE WHEN o."payment_method" = 'cod' THEN 'cod_' ELSE 'manual_' END) || o."id"::text,
  o."total",
  (CASE o."payment_state"
     WHEN 'paid' THEN 'paid' WHEN 'refunded' THEN 'refunded' WHEN 'failed' THEN 'failed'
     WHEN 'pending_verification' THEN 'processing' ELSE 'pending' END)::"payment_status",
  coalesce(o."payment_method", 'manual'),
  CASE WHEN o."payment_state" IN ('paid', 'refunded') THEN coalesce(o."paid_at", o."completed_at", o."created_at") END
FROM "orders" o
WHERE NOT EXISTS (SELECT 1 FROM "payment_transactions" p WHERE p."order_id" = o."id")
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- 5) Stock ledger rows that predate locations get the shop's default.
UPDATE "stock_movements" m SET "location_id" = l."id"
FROM "locations" l
WHERE m."location_id" IS NULL AND l."tenant_id" = m."tenant_id" AND l."is_default";
