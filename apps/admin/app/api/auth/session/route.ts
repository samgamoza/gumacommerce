import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@guma-commerce/auth";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      userId: session.userId,
      email: session.email,
      role: session.role,
      tenantId: session.tenantId,
      tenantSlug: session.tenantSlug,
      tenantName: session.tenantName,
      displayName: session.displayName,
      emailVerified: session.emailVerified,
      needsShopSetup: session.needsShopSetup,
    },
  });
}
