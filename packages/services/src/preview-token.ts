import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, short-lived link that lets a signed-in seller see their shop's
 * unpublished draft on the storefront host (a different domain from admin, so
 * the admin session cookie isn't available there).
 *
 * Format: `${exp}.${hmacHex}` where the HMAC covers `preview:${slug}:${exp}`.
 * Secret: STOREFRONT_PREVIEW_SECRET (falls back to AUTH_SECRET). Without a
 * secret, signing throws and verification always fails — drafts stay private.
 */

export const PREVIEW_TOKEN_TTL_SECONDS = 2 * 60 * 60;

function previewSecret(): string {
  const secret = (process.env.STOREFRONT_PREVIEW_SECRET ?? process.env.AUTH_SECRET ?? "").trim();
  return secret.length >= 32 ? secret : "";
}

function mac(secret: string, slug: string, exp: number): string {
  return createHmac("sha256", secret).update(`preview:${slug}:${exp}`).digest("hex");
}

export function signStorefrontPreviewToken(
  slug: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): string {
  const secret = previewSecret();
  if (!secret) {
    throw new Error("STOREFRONT_PREVIEW_SECRET (or AUTH_SECRET) must be at least 32 characters.");
  }
  const exp = nowSeconds + PREVIEW_TOKEN_TTL_SECONDS;
  return `${exp}.${mac(secret, slug, exp)}`;
}

export function verifyStorefrontPreviewToken(
  slug: string,
  token: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  const secret = previewSecret();
  if (!secret || !token) return false;
  const [expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || !sig || exp < nowSeconds) return false;
  if (exp > nowSeconds + PREVIEW_TOKEN_TTL_SECONDS + 60) return false;
  const expected = Buffer.from(mac(secret, slug, exp));
  const provided = Buffer.from(sig);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
