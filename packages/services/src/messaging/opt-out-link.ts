import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * "Stop reminders" link for SMS.
 *
 * Semaphore only sends — buyers can't reply STOP to a sender name — so every
 * reminder carries a short signed link instead: `{web}/stop/<token>`.
 * The token is the phone (digits, base64url) + a truncated HMAC, so nobody can
 * opt out a number they don't hold a link for.
 *
 * Secret: SMS_OPT_OUT_SECRET, falling back to STOREFRONT_PREVIEW_SECRET then
 * AUTH_SECRET (≥32 chars). Without one, links can't be made (and reminder SMS
 * are refused by sendWithLog, which requires the link).
 */

const MAC_CHARS = 12;

function secret(): string {
  const value = (
    process.env.SMS_OPT_OUT_SECRET ??
    process.env.STOREFRONT_PREVIEW_SECRET ??
    process.env.AUTH_SECRET ??
    ""
  ).trim();
  return value.length >= 32 ? value : "";
}

/** PH mobile → 09XXXXXXXXX (same normalization as the message log). */
export function normalizeOptOutPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
}

function mac(key: string, phone: string): string {
  return createHmac("sha256", key).update(`sms-opt-out:${phone}`).digest("base64url").slice(0, MAC_CHARS);
}

export function signOptOutToken(phone: string): string {
  const key = secret();
  if (!key) throw new Error("SMS_OPT_OUT_SECRET (or AUTH_SECRET) must be at least 32 characters.");
  const normalized = normalizeOptOutPhone(phone);
  if (normalized.length < 10) throw new Error("Not a phone number.");
  return `${Buffer.from(normalized).toString("base64url")}.${mac(key, normalized)}`;
}

/** Returns the phone the token was made for, or null if it's not genuine. */
export function verifyOptOutToken(token: string | null | undefined): string | null {
  const key = secret();
  if (!key || !token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig || sig.length !== MAC_CHARS) return null;
  let phone: string;
  try {
    phone = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!/^\d{10,15}$/.test(phone)) return null;
  const expected = Buffer.from(mac(key, phone));
  const provided = Buffer.from(sig);
  return expected.length === provided.length && timingSafeEqual(expected, provided) ? phone : null;
}

export function optOutUrl(phone: string, webBaseUrl: string): string {
  return `${webBaseUrl.replace(/\/$/, "")}/stop/${signOptOutToken(phone)}`;
}

/** Appends the stop link to a reminder. Every marketing SMS must go through this. */
export function withOptOutFooter(body: string, phone: string, webBaseUrl: string): string {
  return `${body.trim()} Stop reminders: ${optOutUrl(phone, webBaseUrl)}`;
}
