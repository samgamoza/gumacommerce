import { randomBytes } from "node:crypto";

const OAUTH_STATE_COOKIE = "google_oauth_state";

export function createGoogleOAuthState(intent: "login" | "signup"): {
  state: string;
  cookieValue: string;
} {
  const nonce = randomBytes(16).toString("hex");
  const state = Buffer.from(JSON.stringify({ intent, nonce })).toString("base64url");
  return { state, cookieValue: state };
}

export function parseGoogleOAuthState(state: string): { intent: "login" | "signup"; nonce: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      intent?: string;
      nonce?: string;
    };
    if (
      (parsed.intent === "login" || parsed.intent === "signup") &&
      typeof parsed.nonce === "string"
    ) {
      return { intent: parsed.intent, nonce: parsed.nonce };
    }
    return null;
  } catch {
    return null;
  }
}

export function googleOAuthStateCookieHeader(state: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${secure}`;
}

export function clearGoogleOAuthStateCookieHeader(): string {
  return `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export function readGoogleOAuthStateCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === OAUTH_STATE_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export { OAUTH_STATE_COOKIE };
