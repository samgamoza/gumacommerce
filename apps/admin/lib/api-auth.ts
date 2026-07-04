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
