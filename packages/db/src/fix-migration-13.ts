/**
 * One-off repair: migration 0013_support_helpdesk was recorded as applied but
 * none of its objects exist. `db:migrate` cannot fix this, because drizzle-kit
 * only applies migrations NEWER than the newest already-applied one — 0013
 * (1784472036087) is older than 0017 (1784800000000), so it is skipped forever.
 *
 * This applies 0013's SQL directly, then records it in the ledger.
 * Safe to re-run: aborts if the tables already exist. Touches no app data.
 *
 * Run:    pnpm --filter @guma-commerce/db exec tsx src/fix-migration-13.ts
 * Then:   pnpm db:inspect
 * After:  delete this file.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import postgres from "postgres";
import { getDatabaseUrl } from "./env";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "../../..");
config({ path: path.join(rootDir, ".env") });

const TAG = "0013_support_helpdesk";
const drizzleDir = path.resolve(here, "../drizzle");
const sqlPath = path.join(drizzleDir, `${TAG}.sql`);

const fileBuf = readFileSync(sqlPath);
const hash = createHash("sha256").update(fileBuf).digest("hex");

const journal = JSON.parse(
  readFileSync(path.join(drizzleDir, "meta", "_journal.json"), "utf8")
) as { entries: Array<{ idx: number; tag: string; when: number }> };
const entry = journal.entries.find((e) => e.tag === TAG);
if (!entry) {
  console.error(`No journal entry for ${TAG} — aborting.`);
  process.exit(1);
}

const sql = postgres(getDatabaseUrl("migrate"), { ssl: "require", prepare: false });

const existing = await sql<{ tablename: string }[]>`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('support_tickets', 'support_ticket_messages')
`;
if (existing.length > 0) {
  console.log(
    `Already present (${existing.map((r) => r.tablename).join(", ")}) — nothing to do.`
  );
  await sql.end();
  process.exit(0);
}

const statements = fileBuf
  .toString("utf8")
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Applying ${TAG} (${statements.length} statements)…`);
await sql.begin(async (tx) => {
  for (const statement of statements) {
    await tx.unsafe(statement);
  }
  await tx`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${entry.when})
  `;
});

const after = await sql<{ tablename: string }[]>`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('support_tickets', 'support_ticket_messages')
  ORDER BY tablename
`;
console.log(`Done. Created: ${after.map((r) => r.tablename).join(", ")}`);
console.log("Ledger row recorded. Now run: pnpm db:inspect");

await sql.end();
