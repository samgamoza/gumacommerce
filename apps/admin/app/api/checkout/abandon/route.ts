import { NextResponse } from "next/server";
import {
  abandonStaleCheckoutSessions,
  getTenantCheckoutState,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

/**
 * Sweep stale checkout sessions → abandoned + emit Checkout.Abandoned.V1.
 * Seller (or cron via seller session) triggers from Workspace Checkout.
 */
export async function POST() {
  try {
    const session = await requireTenantSession();
    const state = await getTenantCheckoutState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const abandoned = await abandonStaleCheckoutSessions({
      tenantId: session.tenantId,
      abandonedAfterMinutes: state.published.abandonedAfterMinutes ?? 60,
    });

    if (abandoned.length > 0) {
      const { ensureEventsWired } = await import("@/lib/events-bootstrap");
      ensureEventsWired();
      const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
      for (const row of abandoned) {
        const cart = Array.isArray(row.cartJson) ? row.cartJson : [];
        await emitDomainEvent({
          name: EVENT_NAMES.CHECKOUT_ABANDONED,
          data: {
            tenantId: session.tenantId,
            sessionId: row.id,
            sessionKey: row.sessionKey,
            itemCount: cart.length,
          },
          idempotencyKey: `Checkout.Abandoned.V1:${row.id}`,
        });
      }
    }

    return NextResponse.json({ ok: true, abandoned: abandoned.length });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[checkout abandon]", error);
    return NextResponse.json({ ok: false, error: "Sweep failed." }, { status: 500 });
  }
}
