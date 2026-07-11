import { NextResponse } from "next/server";
import { runWalletSettlement } from "@guma-commerce/db";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Hourly cron: release cleared earnings, auto-request payouts, process queued transfers. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWalletSettlement();
  return NextResponse.json({ ok: true, ...result });
}
