import { getUserSessionById, isSessionCurrent } from "@guma-commerce/auth";
import { getSession, type Session } from "@/lib/session";

export async function requireTenantSession(): Promise<
  Session & { tenantId: string; tenantSlug: string; tenantName: string }
> {
  const session = await getSession();
  if (!session) {
    throw new ApiAuthError("Not signed in.", 401);
  }

  const current = await isSessionCurrent(session.userId, session.sessionVersion);
  if (!current) {
    throw new ApiAuthError("Session expired. Please sign in again.", 401);
  }

  // Trust the database over the JWT for tenant linkage — stale cookies are common
  // after shop setup or when a platform-admin session is reused on the seller app.
  const fresh = await getUserSessionById(session.userId);
  if (!fresh) {
    throw new ApiAuthError("Not signed in.", 401);
  }

  if (fresh.role === "super_admin" && !fresh.tenantId) {
    throw new ApiAuthError(
      "This platform admin account has no shop on the seller dashboard. Sign in with a seller account, or create one via Sign up.",
      403,
      "PLATFORM_ADMIN_NO_TENANT"
    );
  }

  if (!fresh.tenantId || !fresh.tenantSlug) {
    throw new ApiAuthError(
      "Finish shop setup first — choose your shop name and URL to continue.",
      403,
      "SHOP_SETUP_REQUIRED"
    );
  }

  if (
    fresh.role !== "seller_owner" &&
    fresh.role !== "seller_staff" &&
    fresh.role !== "super_admin"
  ) {
    throw new ApiAuthError("This account cannot access the seller dashboard.", 403);
  }

  return {
    ...session,
    tenantId: fresh.tenantId,
    tenantSlug: fresh.tenantSlug,
    tenantName: fresh.tenantName ?? "",
    needsShopSetup: false,
  };
}

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}
