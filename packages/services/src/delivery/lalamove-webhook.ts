import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Lalamove v3 webhook signature check.
 *
 * Per Lalamove's webhook guide the signature is computed with your API secret
 * over the timestamp, the HTTP method, YOUR webhook URL path (after the domain,
 * e.g. "/api/webhooks/lalamove") and the event `data`, in the same layout as
 * their request signing:
 *
 *   `${timestamp}\r\nPOST\r\n${path}\r\n\r\n${JSON.stringify(data)}`
 *
 * The previous check signed the whole raw body — which contains the signature
 * itself — so no genuine Lalamove event could ever pass it.
 *
 * ⚠ Confirm with one sandbox event before relying on it (plan §3.1 #3): if the
 * sandbox signature doesn't match, log `candidates` locally and compare.
 */
export interface LalamoveWebhookPayload {
  apiKey?: string;
  timestamp?: number | string;
  signature?: string;
  data?: unknown;
}

export function lalamoveSignatureBase(input: {
  timestamp: string | number;
  path: string;
  data: unknown;
}): string {
  return `${input.timestamp}\r\nPOST\r\n${input.path}\r\n\r\n${JSON.stringify(input.data ?? {})}`;
}

export function verifyLalamoveWebhook(input: {
  payload: LalamoveWebhookPayload;
  /** Path Lalamove was given, e.g. "/api/webhooks/lalamove". */
  path: string;
  secret: string;
  /** When set, the payload's apiKey must match (Lalamove's first validation step). */
  expectedApiKey?: string;
}): boolean {
  const { payload, secret } = input;
  if (!secret || !payload.timestamp || typeof payload.signature !== "string") return false;
  if (input.expectedApiKey && payload.apiKey !== input.expectedApiKey) return false;

  const expected = createHmac("sha256", secret)
    .update(lalamoveSignatureBase({ timestamp: payload.timestamp, path: input.path, data: payload.data }))
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(payload.signature.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
