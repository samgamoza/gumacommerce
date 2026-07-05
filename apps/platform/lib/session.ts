import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "@guma-commerce/auth";

export type { SessionPayload };

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Server-component guard: only super_admins may proceed. */
export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/login");
  }
  return session;
}
