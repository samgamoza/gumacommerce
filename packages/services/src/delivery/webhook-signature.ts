import { createHmac, timingSafeEqual } from "crypto";

/**
 * Shared HMAC helpers for courier webhooks.
 * When a secret is configured, signatures are required; when unset, callers decide.
 */

export function verifyTimestampedHmacSignature(input: {
  rawBody: string;
  signature: string;
  timestamp: string | number;
  secret: string;
}): boolean {
  const { rawBody, signature, timestamp, secret } = input;
  if (!secret.trim() || !signature || timestamp === undefined || timestamp === "") {
    return false;
  }
  const signed = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(String(signature));
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
