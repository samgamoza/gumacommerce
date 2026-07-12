import { randomUUID } from "node:crypto";
import { inngest, isInngestConfigured } from "./client";
import { DomainEventSchema, EVENT_NAMES, type EmitPayload } from "./schemas";

export type PersistEventFn = (input: {
  name: string;
  tenantId: string | null;
  idempotencyKey: string;
  correlationId: string | null;
  payload: Record<string, unknown>;
}) => Promise<void>;

export type EventHandlerFn = (event: {
  name: string;
  data: Record<string, unknown>;
  tenantId: string | null;
}) => Promise<void>;

let persistFn: PersistEventFn | null = null;
let localHandlers: EventHandlerFn[] = [];

/** Register DB persistence (wired from apps that have @guma-commerce/db). */
export function registerEventPersistence(fn: PersistEventFn): void {
  persistFn = fn;
}

/** Local/dev handlers when Inngest cloud is not connected. */
export function registerLocalEventHandler(fn: EventHandlerFn): void {
  localHandlers.push(fn);
}

/**
 * Emit a domain event.
 * 1. Validate with Zod
 * 2. Persist to domain_events (if registered)
 * 3. Send to Inngest when configured
 * 4. Run local handlers (side effects) for immediate processing in monorepo
 */
export async function emitDomainEvent(payload: EmitPayload): Promise<{ ok: boolean; idempotencyKey: string }> {
  const idempotencyKey =
    payload.idempotencyKey ?? `${payload.name}:${"tenantId" in payload.data ? payload.data.tenantId : "platform"}:${randomUUID()}`;
  const correlationId = payload.correlationId ?? randomUUID();

  const event = DomainEventSchema.parse({
    name: payload.name,
    data: payload.data,
    tenantId: "tenantId" in payload.data ? payload.data.tenantId : undefined,
    correlationId,
    idempotencyKey,
  });

  const tenantId =
    "tenantId" in event.data ? (event.data.tenantId as string) : event.tenantId ?? null;

  if (persistFn) {
    try {
      await persistFn({
        name: event.name,
        tenantId,
        idempotencyKey,
        correlationId,
        payload: event as unknown as Record<string, unknown>,
      });
    } catch (error) {
      // Duplicate idempotency key — treat as success (at-least-once)
      const message = error instanceof Error ? error.message : String(error);
      if (!/unique|duplicate/i.test(message)) {
        console.error("[events] persist failed", error);
      }
    }
  }

  if (isInngestConfigured()) {
    try {
      await inngest.send({
        name: event.name,
        data: { ...event.data, correlationId, idempotencyKey },
        id: idempotencyKey,
      });
    } catch (error) {
      console.error("[events] inngest send failed", error);
    }
  }

  for (const handler of localHandlers) {
    try {
      await handler({
        name: event.name,
        data: event.data as Record<string, unknown>,
        tenantId,
      });
    } catch (error) {
      console.error(`[events] local handler failed for ${event.name}`, error);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[events] ${event.name}`, { tenantId, idempotencyKey });
  }

  return { ok: true, idempotencyKey };
}

export { EVENT_NAMES };
