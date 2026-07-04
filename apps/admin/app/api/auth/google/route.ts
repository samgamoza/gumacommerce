import { NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleAuthConfigured } from "@guma-commerce/auth";
import {
  createGoogleOAuthState,
  googleOAuthStateCookieHeader,
} from "@/lib/google-oauth-state";

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Google sign-in is not configured yet." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const intent = searchParams.get("intent") === "signup" ? "signup" : "login";
  const { state, cookieValue } = createGoogleOAuthState(intent);

  const response = NextResponse.redirect(getGoogleAuthUrl(state));
  response.headers.set("Set-Cookie", googleOAuthStateCookieHeader(cookieValue));
  return response;
}
