import { getSession } from "@/lib/session";
import type { SessionPayload } from "@guma-commerce/auth";

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

/** Route-handler / server-action guard: throws unless caller is a super_admin. */
export async function requireSuperAdminApi(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new ApiAuthError("Not signed in.", 401);
  }
  if (session.role !== "super_admin") {
    throw new ApiAuthError("Super-admin access required.", 403);
  }
  return session;
}
