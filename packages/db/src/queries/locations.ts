import { and, eq } from "drizzle-orm";
import { getDb } from "../client";
import { locations } from "../schema/index";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type LocationRow = typeof locations.$inferSelect;

/**
 * The shop's default location (V1 has exactly one). Created on first use, so
 * shops that signed up before migration 0022 — or after it, via any signup
 * path — always have one. Race-safe through the unique partial index.
 */
export async function getDefaultLocationId(
  tx: Tx | Db,
  tenantId: string,
  fallbackName = "Main store"
): Promise<string> {
  const [existing] = await tx
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.tenantId, tenantId), eq(locations.isDefault, true)))
    .limit(1);
  if (existing) return existing.id;

  await tx
    .insert(locations)
    .values({ tenantId, name: fallbackName, isDefault: true, isActive: true })
    .onConflictDoNothing();
  const [created] = await tx
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.tenantId, tenantId), eq(locations.isDefault, true)))
    .limit(1);
  if (!created) throw new Error("Could not create the default location.");
  return created.id;
}

export async function getDefaultLocation(tenantId: string): Promise<LocationRow | null> {
  const db = getDb();
  await getDefaultLocationId(db, tenantId);
  const [row] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.tenantId, tenantId), eq(locations.isDefault, true)))
    .limit(1);
  return row ?? null;
}
