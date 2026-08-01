-- Phase 2: domain event log for Inngest + local audit/replay
CREATE TABLE IF NOT EXISTS "domain_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid REFERENCES "tenants"("id"),
  "event_name" varchar(120) NOT NULL,
  "idempotency_key" varchar(255) NOT NULL,
  "correlation_id" varchar(64),
  "payload_json" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "domain_events_idempotency_uidx" ON "domain_events" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "domain_events_tenant_idx" ON "domain_events" ("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "domain_events_name_idx" ON "domain_events" ("event_name", "created_at");
