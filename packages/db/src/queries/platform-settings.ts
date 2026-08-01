import { eq } from "drizzle-orm";
import { getDb } from "../client";
import { platformSettings } from "../schema/index";

/** Which marketing landing the public "/" route renders. */
export type ActiveLanding = "frontend1" | "frontend2";
export const ACTIVE_LANDING_KEY = "active_landing";

export async function getPlatformSetting(key: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1);
  return row?.value ?? null;
}

export async function setPlatformSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db
    .insert(platformSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date() } });
}

/** Active landing, defaulting to frontend1 (GumaCommerce) when unset. */
export async function getActiveLanding(): Promise<ActiveLanding> {
  const value = await getPlatformSetting(ACTIVE_LANDING_KEY);
  return value === "frontend2" ? "frontend2" : "frontend1";
}

export async function setActiveLanding(value: ActiveLanding): Promise<void> {
  await setPlatformSetting(ACTIVE_LANDING_KEY, value);
}
