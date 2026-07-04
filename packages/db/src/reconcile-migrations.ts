import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import postgres from "postgres";
import { getDatabaseUrl } from "./env";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: path.join(rootDir, ".env") });

const drizzleDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../drizzle");

function migrationHash(tag: string): string {
  const filePath = path.join(drizzleDir, `${tag}.sql`);
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

const sql = postgres(getDatabaseUrl("migrate"), { ssl: "require", prepare: false });

const agentTables = ["content_queue", "agent_runs", "shop_chat_messages", "ai_usage_monthly"];
const existing = await sql<{ tablename: string }[]>`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public' AND tablename = ANY(${agentTables})
`;

const applied = await sql<{ hash: string }[]>`
  SELECT hash FROM drizzle.__drizzle_migrations
`;

const targetHash = migrationHash("0001_sweet_mandroid");
const alreadyApplied = applied.some((row) => row.hash === targetHash);

if (alreadyApplied) {
  console.log("Migration 0001 already recorded — nothing to do.");
} else if (existing.length === agentTables.length) {
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${targetHash}, ${Date.now()})
  `;
  console.log("Recorded 0001_sweet_mandroid — agent tables already present from prior db:push.");
} else if (existing.length === 0) {
  console.log("Agent tables missing — run pnpm db:migrate to apply 0001.");
} else {
  console.warn(
    `Partial agent schema (${existing.map((r) => r.tablename).join(", ")}). Fix manually before deploy.`
  );
  process.exitCode = 1;
}

await sql.end();
