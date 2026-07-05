/**
 * Fixed-window rate limiter for public endpoints.
 *
 * Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL / _TOKEN are set so
 * limits hold across serverless instances. Falls back to a per-instance
 * in-memory window otherwise (fine for dev, best-effort in prod).
 */

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (memoryBuckets.size > 10_000) {
    for (const [k, bucket] of memoryBuckets) {
      if (bucket.resetAt <= now) memoryBuckets.delete(k);
    }
  }

  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
  if (existing.count > options.limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: options.limit - existing.count, retryAfterSeconds: 0 };
}

async function upstashRateLimit(
  url: string,
  token: string,
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      // NX: only set the TTL when the key has none (first hit in the window).
      ["EXPIRE", redisKey, String(options.windowSeconds), "NX"],
      ["TTL", redisKey],
    ]),
    signal: AbortSignal.timeout(2000),
  });

  if (!res.ok) {
    throw new Error(`Upstash rate limit request failed (${res.status})`);
  }

  const results = (await res.json()) as Array<{ result: unknown }>;
  const count = Number(results[0]?.result ?? 0);
  const ttl = Number(results[2]?.result ?? options.windowSeconds);
  const retryAfterSeconds = ttl > 0 ? ttl : options.windowSeconds;

  if (count > options.limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: options.limit - count, retryAfterSeconds: 0 };
}

/**
 * Checks (and consumes) one request against the limit for `key`.
 * Fails open: an unreachable Redis never blocks real traffic.
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return await upstashRateLimit(url, token, key, options);
    } catch (error) {
      console.error("[rate-limit] Upstash unavailable, falling back to memory:", error);
    }
  }
  return memoryRateLimit(key, options);
}

/** Best-effort client IP for rate-limit keys (Vercel/most proxies set x-forwarded-for). */
export function clientIpFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Standard 429 JSON body + headers for a blocked request. */
export function rateLimitResponseInit(result: RateLimitResult): ResponseInit {
  return {
    status: 429,
    headers: {
      "Retry-After": String(Math.max(result.retryAfterSeconds, 1)),
      "Content-Type": "application/json",
    },
  };
}
