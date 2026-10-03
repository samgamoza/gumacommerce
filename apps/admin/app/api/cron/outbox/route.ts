import { NextResponse } from "next/server";
import { outboxBacklog, relayOutbox } from "@gumakart/db";
import { inngest, isInngestConfigured } from "@gumakart/events";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Outbox relay (every minute). Order events are written inside the same
 * transaction as the order change; this hands them to Inngest with
 * id = idempotency key, so a row sent twice is still delivered once.
 * Failures back off 1m → 5m → 30m → 2h and stop after 10 attempts.
 *
 * Without Inngest configured there is no consumer yet (SMS recipes arrive in
 * Phase 4), so rows are marked published and kept as the order event log.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const live = isInngestConfigured();
  const result = await relayOutbox(
    async (row) => {
      if (!live) return;
      await inngest.send({
        id: row.idempotencyKey,
        name: row.name,
        data: { ...row.data, idempotencyKey: row.idempotencyKey },
      });
    },
    { limit: 100 }
  );
  const backlog = await outboxBacklog();
  if (backlog.stuck > 0) {
    console.error("[outbox] events gave up after max attempts", backlog);
  }
  return NextResponse.json({ ok: true, inngest: live, ...result, backlog });
}
