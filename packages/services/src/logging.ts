/**
 * Structured logging + error tracking.
 *
 * - In production, logs are single-line JSON (level, scope, msg, context)
 *   so Vercel/Datadog/Logtail can parse them.
 * - In development, logs stay human-readable.
 * - captureError() additionally forwards exceptions to Sentry when SENTRY_DSN
 *   is set, using the plain envelope API (no SDK dependency).
 */

type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

const IS_PROD = process.env.NODE_ENV === "production";

function emit(level: LogLevel, scope: string, message: string, context?: LogContext): void {
  if (IS_PROD) {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      scope,
      msg: message,
      ...context,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return;
  }

  const prefix = `[${scope}]`;
  const args: unknown[] = context ? [prefix, message, context] : [prefix, message];
  if (level === "error") console.error(...args);
  else if (level === "warn") console.warn(...args);
  else console.log(...args);
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => emit("debug", scope, message, context),
    info: (message, context) => emit("info", scope, message, context),
    warn: (message, context) => emit("warn", scope, message, context),
    error: (message, error, context) => {
      const errorInfo =
        error instanceof Error
          ? { errorMessage: error.message, stack: error.stack }
          : error !== undefined
            ? { errorMessage: String(error) }
            : {};
      emit("error", scope, message, { ...errorInfo, ...context });
      void captureError(error ?? new Error(message), { scope, message, ...context });
    },
  };
}

interface ParsedDsn {
  ingestUrl: string;
  publicKey: string;
}

function parseSentryDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!url.username || !projectId) return null;
    return {
      ingestUrl: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget error report to Sentry (or any Sentry-compatible ingest).
 * No-op when SENTRY_DSN is unset. Never throws.
 */
export async function captureError(error: unknown, context?: LogContext): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  const err = error instanceof Error ? error : new Error(String(error));
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = new Date().toISOString();

  const event = {
    event_id: eventId,
    timestamp,
    platform: "node",
    level: "error",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? {
                frames: err.stack
                  .split("\n")
                  .slice(1, 30)
                  .map((line) => ({ function: line.trim() }))
                  .reverse(),
              }
            : undefined,
        },
      ],
    },
    extra: context,
  };

  const envelope =
    JSON.stringify({ event_id: eventId, sent_at: timestamp, dsn }) +
    "\n" +
    JSON.stringify({ type: "event" }) +
    "\n" +
    JSON.stringify(event);

  try {
    await fetch(parsed.ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=guma-commerce/1.0`,
      },
      body: envelope,
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Error tracking must never break the request path.
  }
}
