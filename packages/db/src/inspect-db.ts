import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { getDatabaseUrl } from "./env";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: path.join(rootDir, ".env") });

const sql = postgres(getDatabaseUrl("migrate"), { ssl: "require", prepare: false });

const tables = await sql`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
`;
const types = await sql`
  SELECT typname FROM pg_type
  WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e'
  ORDER BY typname
`;
const migrations = await sql`
  SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at
`;

console.log("TABLES:", tables.map((t) => t.tablename).join(", "));
console.log("ENUMS:", types.map((t) => t.typname).join(", "));
console.log("MIGRATIONS:", migrations);

await sql.end();
