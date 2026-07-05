import { isSessionCurrent } from "@guma-commerce/auth";
import { getSession, type Session } from "@/lib/session";

export async function requireTenantSession(): Promise<
  Session & { tenantId: string; tenantSlug: string; tenantName: string }
> {
  const session = await getSession();
  if (!session) {
    throw new ApiAuthError("Not signed in.", 401);
  }
  if (session.needsShopSetup || !session.tenantId || !session.tenantSlug) {
    throw new ApiAuthError("Complete shop setup first.", 403);
  }
  // Server-side revocation check: tokens minted before a "log out all
  // devices" bump are rejected even though the JWT itself is still valid.
  const current = await isSessionCurrent(session.userId, session.sessionVersion);
  if (!current) {
    throw new ApiAuthError("Session expired. Please sign in again.", 401);
  }
  return session as Session & { tenantId: string; tenantSlug: string; tenantName: string };
}

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}
