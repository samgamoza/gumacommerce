/**
 * Resolve Postgres URLs for migrations vs app runtime.
 *
 * Supports two naming conventions:
 *
 * A) Neon ↔ Vercel integration (automatic):
 *    DATABASE_URL           → pooled  (app runtime)
 *    DATABASE_URL_UNPOOLED  → direct  (migrations)
 *
 * B) Manual .env (local dev):
 *    DATABASE_URL           → direct  (migrations)
 *    DATABASE_URL_POOLED    → pooled  (app runtime)
 */
export type DbConnectionMode = "migrate" | "app";

export function isPooledUrl(url: string): boolean {
  return url.includes("-pooler");
}

export function getDatabaseUrl(mode: DbConnectionMode = "app"): string {
  if (mode === "migrate") {
    const url =
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DIRECT_URL ??
      (process.env.DATABASE_URL_POOLED && process.env.DATABASE_URL
        ? process.env.DATABASE_URL
        : process.env.DATABASE_URL && !isPooledUrl(process.env.DATABASE_URL)
          ? process.env.DATABASE_URL
          : undefined);

    if (!url) {
      throw new Error(
        "No direct Postgres URL for migrations. Set DATABASE_URL_UNPOOLED (Neon+Vercel) or DATABASE_URL without -pooler (local .env)."
      );
    }
    return url;
  }

  const url =
    process.env.DATABASE_URL_POOLED ??
    (process.env.DATABASE_URL && isPooledUrl(process.env.DATABASE_URL)
      ? process.env.DATABASE_URL
      : undefined) ??
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "No Postgres URL for app runtime. Set DATABASE_URL (Neon+Vercel pooled) or DATABASE_URL_POOLED (local .env)."
    );
  }

  return url;
}

export function isNeonDatabase(url: string): boolean {
  return url.includes("neon.tech") || url.includes("neon.database");
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
