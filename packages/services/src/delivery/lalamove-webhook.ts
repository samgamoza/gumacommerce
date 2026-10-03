import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Lalamove v3 webhook signature check.
 *
 * Per Lalamove's webhook guide the signature is an HMAC-SHA256 with your API
 * secret over the timestamp, the HTTP method, YOUR webhook URL path (after the
 * domain, e.g. "/api/webhooks/lalamove") and the event `data`, in the same
 * layout as their request signing:
 *
 *   `${timestamp}\r\nPOST\r\n${path}\r\n\r\n${data}`
 *
 * The guide doesn't pin down two details, so we accept the small set of
 * readings below (every one still requires the API secret, so none is weaker)
 * and report which one matched. Run `pnpm --filter @gumakart/services
 * lalamove:check` against the sandbox once, read the `variant` in the web
 * logs, then set LALAMOVE_WEBHOOK_VARIANT to it to accept only that one.
 *   - data: `json` = JSON.stringify(parsed data) · `raw` = the exact bytes of
 *     the "data" value as sent
 *   - path: as configured, or with/without a trailing slash
 */
export interface LalamoveWebhookPayload {
  apiKey?: string;
  timestamp?: number | string;
  signature?: string;
  data?: unknown;
}

export type LalamoveSignatureVariant = "json" | "raw" | "json-slash" | "raw-slash";

export function lalamoveSignatureBase(input: {
  timestamp: string | number;
  path: string;
  data: unknown;
}): string {
  return `${input.timestamp}\r\nPOST\r\n${input.path}\r\n\r\n${JSON.stringify(input.data ?? {})}`;
}

/** The exact text of a top-level JSON key's value (objects/arrays only), or null. */
export function rawJsonValue(rawBody: string, key: string): string | null {
  const keyPattern = new RegExp(`"${key}"\\s*:\\s*`, "g");
  let match: RegExpExecArray | null;
  while ((match = keyPattern.exec(rawBody))) {
    const start = match.index + match[0].length;
    const open = rawBody[start];
    if (open !== "{" && open !== "[") continue;
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    for (let i = start; i < rawBody.length; i += 1) {
      const ch = rawBody[i];
      if (inString) {
        if (ch === "\\") i += 1;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === open) depth += 1;
      else if (ch === close) {
        depth -= 1;
        if (depth === 0) return rawBody.slice(start, i + 1);
      }
    }
    return null;
  }
  return null;
}

function hmacHex(secret: string, base: string): string {
  return createHmac("sha256", secret).update(base).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

export function verifyLalamoveWebhook(input: {
  payload: LalamoveWebhookPayload;
  /** Path Lalamove was given, e.g. "/api/webhooks/lalamove". */
  path: string;
  secret: string;
  /** The body exactly as received — needed for the `raw` variants. */
  rawBody?: string;
  /** When set, the payload's apiKey must match (Lalamove's first validation step). */
  expectedApiKey?: string;
  /** Pin to one variant once the sandbox check has shown which Lalamove uses. */
  only?: LalamoveSignatureVariant;
}): { ok: boolean; variant?: LalamoveSignatureVariant } {
  const { payload, secret } = input;
  if (!secret || !payload.timestamp || typeof payload.signature !== "string") return { ok: false };
  if (input.expectedApiKey && payload.apiKey !== input.expectedApiKey) return { ok: false };

  const trimmed = input.path.replace(/\/+$/, "") || "/";
  const slashed = `${trimmed}/`;
  const json = JSON.stringify(payload.data ?? {});
  const raw = input.rawBody ? rawJsonValue(input.rawBody, "data") : null;
  const base = (path: string, data: string) => `${payload.timestamp}\r\nPOST\r\n${path}\r\n\r\n${data}`;

  const candidates: Array<[LalamoveSignatureVariant, string | null]> = [
    ["json", base(trimmed, json)],
    ["raw", raw === null ? null : base(trimmed, raw)],
    ["json-slash", base(slashed, json)],
    ["raw-slash", raw === null ? null : base(slashed, raw)],
  ];
  for (const [variant, text] of candidates) {
    if (text === null) continue;
    if (input.only && input.only !== variant) continue;
    if (safeEqualHex(hmacHex(secret, text), payload.signature)) return { ok: true, variant };
  }
  return { ok: false };
}
