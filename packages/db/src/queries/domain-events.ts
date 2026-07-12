import { desc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { domainEvents } from "../schema/index";

export async function persistDomainEvent(input: {
  name: string;
  tenantId: string | null;
  idempotencyKey: string;
  correlationId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(domainEvents).values({
    tenantId: input.tenantId,
    eventName: input.name,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    payloadJson: input.payload,
  });
}

export interface DomainEventRow {
  id: string;
  tenantId: string | null;
  eventName: string;
  idempotencyKey: string;
  correlationId: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export async function listDomainEventsForTenant(
  tenantId: string,
  limit = 50
): Promise<DomainEventRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(domainEvents)
    .where(eq(domainEvents.tenantId, tenantId))
    .orderBy(desc(domainEvents.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    eventName: row.eventName,
    idempotencyKey: row.idempotencyKey,
    correlationId: row.correlationId,
    payload: row.payloadJson,
    createdAt: row.createdAt,
  }));
}
