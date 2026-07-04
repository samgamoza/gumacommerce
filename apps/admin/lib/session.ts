import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  getSessionFromRequest,
  verifySessionToken,
  type SessionPayload,
} from "@guma-commerce/auth";

export type { SessionPayload as Session };

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export { getSessionFromRequest };
