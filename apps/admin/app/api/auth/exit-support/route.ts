import { NextResponse } from "next/server";
import { clearSessionCookieHeader, getSessionFromRequest } from "@guma-commerce/auth";

/** End Support access on admin.* and return to Platform Console. */
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  const platformUrl = (
    process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3002"
  ).replace(/\/$/, "");

  const redirectTo =
    session?.supportAccess && session.tenantId
      ? `${platformUrl}/tenants/${session.tenantId}`
      : `${platformUrl}/tenants`;

  const response = NextResponse.json({ ok: true, redirectTo });
  response.headers.set("Set-Cookie", clearSessionCookieHeader());
  return response;
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  const platformUrl = (
    process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3002"
  ).replace(/\/$/, "");
  const redirectTo =
    session?.supportAccess && session.tenantId
      ? `${platformUrl}/tenants/${session.tenantId}`
      : `${platformUrl}/tenants`;

  const response = NextResponse.redirect(redirectTo);
  response.headers.set("Set-Cookie", clearSessionCookieHeader());
  return response;
}
