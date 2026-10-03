import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import { getDatabaseUrl, isNeonDatabase, isProduction } from "./env";

export type Database = PostgresJsDatabase<typeof schema>;

declare global {
  // eslint-disable-next-line no-var
  var __gumaKartDb: Database | undefined;
  // eslint-disable-next-line no-var
  var __gumaKartSql: ReturnType<typeof postgres> | undefined;
}

/**
 * Neon's copy-paste URLs end with `channel_binding=require`. postgres.js sends
 * unknown query params to the server as settings, and Postgres rejects it
 * ("unrecognized configuration parameter channel_binding"), so drop it.
 */
export function normalizeDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return raw.replace(/([?&])channel_binding=[^&]*(&?)/, (_m, lead: string, tail: string) => (tail ? lead : ""));
  }
}

function createClient() {
  const url = normalizeDatabaseUrl(getDatabaseUrl("app"));
  const neon = isNeonDatabase(url);

  const sql = postgres(url, {
    // Required for Neon pooled connections and PgBouncer
    prepare: false,
    // Serverless: keep pool small; dev: allow more concurrent local queries
    max: isProduction() ? 1 : 10,
    idle_timeout: neon ? 20 : 60,
    connect_timeout: 30,
    ssl: neon ? "require" : undefined,
  });

  const db = drizzle(sql, { schema });
  return { db, sql };
}

/**
 * Cloudflare Workers forbid reusing a socket opened by one request in another
 * (the second request just hangs and gets cancelled). OpenNext gives every
 * request its own context object (`globalThis[Symbol.for("__cloudflare-context__")]`),
 * so on Workers we keep one client per request context instead of a global.
 */
const workerClients = new WeakMap<object, { db: Database; sql: ReturnType<typeof postgres> }>();

function currentWorkerRequestContext(): object | null {
  if (typeof navigator === "undefined" || navigator.userAgent !== "Cloudflare-Workers") return null;
  const store = (globalThis as Record<symbol, unknown>)[Symbol.for("__cloudflare-context__")];
  return store && typeof store === "object" ? store : null;
}

/**
 * Lazy singleton — safe for Next.js hot reload and serverless reuse.
 * On Cloudflare Workers: one client per request (see above).
 */
export function getDb(): Database {
  const requestContext = currentWorkerRequestContext();
  if (requestContext) {
    let client = workerClients.get(requestContext);
    if (!client) {
      client = createClient();
      workerClients.set(requestContext, client);
    }
    return client.db;
  }

  if (isProduction()) {
    if (!globalThis.__gumaKartDb) {
      const { db, sql } = createClient();
      globalThis.__gumaKartDb = db;
      globalThis.__gumaKartSql = sql;
    }
    return globalThis.__gumaKartDb;
  }

  if (!globalThis.__gumaKartDb) {
    const { db, sql } = createClient();
    globalThis.__gumaKartDb = db;
    globalThis.__gumaKartSql = sql;
  }

  return globalThis.__gumaKartDb;
}

/** @deprecated Use getDb() — kept for backwards compatibility during migration */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export async function closeDb(): Promise<void> {
  if (globalThis.__gumaKartSql) {
    await globalThis.__gumaKartSql.end();
    globalThis.__gumaKartSql = undefined;
    globalThis.__gumaKartDb = undefined;
  }
}
