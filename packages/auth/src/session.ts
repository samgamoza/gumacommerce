import { SignJWT, jwtVerify } from "jose";
import {
  AUTH_COOKIE_NAME,
  EMAIL_VERIFY_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
  type SessionUser,
} from "./types";

export { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, EMAIL_VERIFY_MAX_AGE_SECONDS };
export type { SessionPayload, SessionUser };

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev-only-guma-commerce-auth-secret-min-32-chars"
      : undefined);
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a random string of at least 32 characters in .env"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: user.tenantSlug,
    tenantName: user.tenantName,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    needsShopSetup: user.needsShopSetup,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function createEmailVerificationToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ purpose: "email_verify", email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${EMAIL_VERIFY_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = payload.sub;
    if (!userId || typeof userId !== "string") return null;

    const email = payload.email;
    const role = payload.role;
    const tenantId = payload.tenantId;
    const tenantSlug = payload.tenantSlug;
    const tenantName = payload.tenantName;
    const displayName = payload.displayName;
    const emailVerified = payload.emailVerified;
    const needsShopSetup = payload.needsShopSetup;

    if (
      typeof email !== "string" ||
      typeof role !== "string" ||
      (tenantId !== null && tenantId !== undefined && typeof tenantId !== "string") ||
      (tenantSlug !== null && tenantSlug !== undefined && typeof tenantSlug !== "string") ||
      (tenantName !== null && tenantName !== undefined && typeof tenantName !== "string") ||
      typeof displayName !== "string" ||
      typeof emailVerified !== "boolean"
    ) {
      return null;
    }

    const resolvedTenantId = typeof tenantId === "string" ? tenantId : null;
    const resolvedTenantSlug = typeof tenantSlug === "string" ? tenantSlug : null;
    const resolvedTenantName = typeof tenantName === "string" ? tenantName : null;
    const resolvedNeedsShopSetup =
      typeof needsShopSetup === "boolean" ? needsShopSetup : !resolvedTenantId;

    return {
      userId,
      email,
      role,
      tenantId: resolvedTenantId,
      tenantSlug: resolvedTenantSlug,
      tenantName: resolvedTenantName,
      displayName,
      emailVerified,
      needsShopSetup: resolvedNeedsShopSetup,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function verifyEmailToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.purpose !== "email_verify") return null;
    const userId = payload.sub;
    const email = payload.email;
    if (!userId || typeof userId !== "string" || typeof email !== "string") return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === AUTH_COOKIE_NAME) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const token = readSessionCookie(request);
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieHeader(token: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  const opts = getSessionCookieOptions(maxAge);
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge}`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}
