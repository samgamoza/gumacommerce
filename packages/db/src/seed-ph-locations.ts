/**
 * Seed PSA PSGC provinces / cities / barangays into ph_locations
 * for checkout address autosuggest.
 *
 * Source: @jobuntux/psgc data/2025-2Q JSON files.
 */
import { config } from "dotenv";
import { createRequire } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { getDb, closeDb } from "./client";
import { phLocations } from "./schema/index";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: path.join(rootDir, ".env") });

const require = createRequire(import.meta.url);

type ProvinceRow = {
  psgcCode: string;
  regCode: string;
  provCode: string;
  provName: string;
};
type MuncityRow = {
  psgcCode: string;
  regCode: string;
  provCode: string;
  munCityCode: string;
  munCityName: string;
};
type BarangayRow = {
  psgcCode: string;
  regCode: string;
  provCode: string;
  munCityCode: string;
  brgyCode: string;
  brgyName: string;
};

function cleanName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value: string): string {
  return cleanName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayProvinceName(name: string): string {
  const cleaned = cleanName(name);
  // "City of Makati" → "Makati City" for familiar checkout labels
  const cityOf = cleaned.match(/^City of\s+(.+)$/i);
  if (cityOf) {
    const base = cleanName(cityOf[1]!);
    return /city$/i.test(base) ? base : `${base} City`;
  }
  return cleaned;
}

async function seedPhLocations() {
  const db = getDb();
  const pkgRoot = path.dirname(require.resolve("@jobuntux/psgc/package.json"));
  const dataDir = path.join(pkgRoot, "data", "2025-2Q");

  const provinces = JSON.parse(
    readFileSync(path.join(dataDir, "provinces.json"), "utf8")
  ) as ProvinceRow[];
  const muncities = JSON.parse(
    readFileSync(path.join(dataDir, "muncities.json"), "utf8")
  ) as MuncityRow[];
  const barangays = JSON.parse(
    readFileSync(path.join(dataDir, "barangays.json"), "utf8")
  ) as BarangayRow[];

  const provinceByCode = new Map(
    provinces.map((p) => [p.provCode, displayProvinceName(p.provName)])
  );
  const cityNameByKey = new Map(
    muncities.map((c) => [`${c.provCode}:${c.munCityCode}`, cleanName(c.munCityName)])
  );

  const rows: Array<typeof phLocations.$inferInsert> = [];

  for (const p of provinces) {
    const name = displayProvinceName(p.provName);
    rows.push({
      psgcCode: p.psgcCode,
      kind: "province",
      name,
      nameNormalized: normalizeName(name),
      provinceCode: p.provCode,
      provinceName: name,
      cityCode: null,
      cityName: null,
    });
  }

  for (const c of muncities) {
    const name = cleanName(c.munCityName);
    const provinceName = provinceByCode.get(c.provCode) ?? c.provCode;
    rows.push({
      psgcCode: c.psgcCode,
      kind: "city",
      name,
      nameNormalized: normalizeName(name),
      provinceCode: c.provCode,
      provinceName,
      cityCode: c.munCityCode,
      cityName: name,
    });
  }

  for (const b of barangays) {
    const name = cleanName(b.brgyName);
    const provinceName = provinceByCode.get(b.provCode) ?? b.provCode;
    rows.push({
      psgcCode: b.psgcCode,
      kind: "barangay",
      name,
      nameNormalized: normalizeName(name),
      provinceCode: b.provCode,
      provinceName,
      cityCode: b.munCityCode,
      cityName: cityNameByKey.get(`${b.provCode}:${b.munCityCode}`) ?? null,
    });
  }

  console.log(
    `Seeding ph_locations: ${provinces.length} provinces, ${muncities.length} cities, ${barangays.length} barangays…`
  );

  await db.execute(sql`TRUNCATE TABLE ph_locations`);

  const chunkSize = 1000;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(phLocations).values(chunk);
    if ((i / chunkSize) % 10 === 0) {
      console.log(`  … ${Math.min(i + chunk.length, rows.length)} / ${rows.length}`);
    }
  }

  console.log(`Done. Inserted ${rows.length} PH location rows.`);
}

seedPhLocations()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
