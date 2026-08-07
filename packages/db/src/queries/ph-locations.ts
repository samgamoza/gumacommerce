import { and, asc, eq, like, sql } from "drizzle-orm";
import { getDb } from "../client";
import { phLocations } from "../schema/index";

export type PhLocationKind = "province" | "city" | "barangay";

export type PhLocationSuggestion = {
  psgcCode: string;
  name: string;
  kind: PhLocationKind;
  provinceCode: string;
  provinceName: string;
  cityCode: string | null;
  cityName: string | null;
};

function normalizeQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function countPhLocations(): Promise<number> {
  const db = getDb();
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(phLocations);
  return row?.count ?? 0;
}

export async function searchPhLocations(input: {
  kind: PhLocationKind;
  q?: string;
  provinceCode?: string;
  cityCode?: string;
  limit?: number;
}): Promise<PhLocationSuggestion[]> {
  const db = getDb();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const q = normalizeQuery(input.q ?? "");

  const filters = [eq(phLocations.kind, input.kind)];
  if (input.kind !== "province" && input.provinceCode) {
    filters.push(eq(phLocations.provinceCode, input.provinceCode));
  }
  if (input.kind === "barangay" && input.cityCode) {
    filters.push(eq(phLocations.cityCode, input.cityCode));
  }
  if (q) {
    filters.push(like(phLocations.nameNormalized, `${q}%`));
  }

  const rows = await db
    .select({
      psgcCode: phLocations.psgcCode,
      name: phLocations.name,
      kind: phLocations.kind,
      provinceCode: phLocations.provinceCode,
      provinceName: phLocations.provinceName,
      cityCode: phLocations.cityCode,
      cityName: phLocations.cityName,
    })
    .from(phLocations)
    .where(and(...filters))
    .orderBy(asc(phLocations.name))
    .limit(limit);

  // Fallback: contains match when prefix returns nothing.
  if (rows.length === 0 && q.length >= 2) {
    const containsFilters = [eq(phLocations.kind, input.kind)];
    if (input.kind !== "province" && input.provinceCode) {
      containsFilters.push(eq(phLocations.provinceCode, input.provinceCode));
    }
    if (input.kind === "barangay" && input.cityCode) {
      containsFilters.push(eq(phLocations.cityCode, input.cityCode));
    }
    containsFilters.push(like(phLocations.nameNormalized, `%${q}%`));
    return db
      .select({
        psgcCode: phLocations.psgcCode,
        name: phLocations.name,
        kind: phLocations.kind,
        provinceCode: phLocations.provinceCode,
        provinceName: phLocations.provinceName,
        cityCode: phLocations.cityCode,
        cityName: phLocations.cityName,
      })
      .from(phLocations)
      .where(and(...containsFilters))
      .orderBy(asc(phLocations.name))
      .limit(limit);
  }

  return rows;
}
