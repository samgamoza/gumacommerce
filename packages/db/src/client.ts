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

function createClient() {
  const url = getDatabaseUrl("app");
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
 * Lazy singleton — safe for Next.js hot reload and serverless reuse.
 */
export function getDb(): Database {
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
