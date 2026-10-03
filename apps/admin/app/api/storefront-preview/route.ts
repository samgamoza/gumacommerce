import { NextResponse } from "next/server";
import { signStorefrontPreviewToken } from "@gumakart/services";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { storefrontBaseUrl } from "@/lib/utils";

/**
 * Opens the signed-in seller's draft storefront. The storefront is on another
 * host, so we hand it a short-lived signed token instead of a session cookie.
 * Anyone can still see the live shop; only drafts need this.
 */
export async function GET(request: Request) {
  try {
    const session = await requireTenantSession();
    const token = signStorefrontPreviewToken(session.tenantSlug);
    const target = new URL(`${storefrontBaseUrl}/${encodeURIComponent(session.tenantSlug)}`);
    target.searchParams.set("preview", "1");
    target.searchParams.set("pt", token);
    return NextResponse.redirect(target.toString(), 302);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.redirect(new URL("/login", request.url), 302);
    }
    console.error("[storefront-preview]", error);
    return NextResponse.json({ ok: false, error: "Preview is unavailable right now." }, { status: 500 });
  }
}
