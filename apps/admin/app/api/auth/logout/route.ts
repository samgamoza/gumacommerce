import { NextResponse } from "next/server";
import { clearSessionCookieHeader, getSessionFromRequest, revokeAllSessions } from "@guma-commerce/auth";

export async function POST(request: Request) {
  // { allDevices: true } bumps the user's session version so every token
  // issued before now (on any device) stops working immediately.
  let allDevices = false;
  try {
    const body = (await request.json()) as { allDevices?: boolean };
    allDevices = body?.allDevices === true;
  } catch {
    // No body — plain single-device logout.
  }

  if (allDevices) {
    const session = await getSessionFromRequest(request);
    if (session) {
      await revokeAllSessions(session.userId);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearSessionCookieHeader());
  return response;
}
