import { NextResponse } from "next/server";
import { DEFAULT_UNPAID_EXPIRY_HOURS, expireUnpaidOrders } from "@gumakart/db";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function expiryHours(): number {
  const raw = Number(process.env.ORDER_UNPAID_EXPIRY_HOURS);
  return Number.isFinite(raw) && raw >= 1 ? raw : DEFAULT_UNPAID_EXPIRY_HOURS;
}

/**
 * Cancels orders still waiting for payment after ORDER_UNPAID_EXPIRY_HOURS
 * (default 24) and puts their stock back. Orders where the buyer already sent a
 * payment reference ("processing") are left for the seller to confirm.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const result = await expireUnpaidOrders({ olderThanHours: expiryHours() });
  return NextResponse.json({ ok: true, ...result });
}
