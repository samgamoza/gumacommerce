import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, closeDb } from "./client";
import { tenants } from "./schema/index";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: path.join(rootDir, ".env") });

async function main() {
  const rows = await getDb()
    .select({ slug: tenants.slug, name: tenants.name, status: tenants.status })
    .from(tenants);
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch(console.error)
  .finally(() => closeDb());
