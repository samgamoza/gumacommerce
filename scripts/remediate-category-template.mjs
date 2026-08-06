/**
 * Remap a tenant off a mismatched food vertical template onto a category-fit skin.
 * Usage: node scripts/remediate-category-template.mjs onestop
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env") });

const slug = (process.argv[2] || "").trim().toLowerCase();
if (!slug) {
  console.error("Usage: node scripts/remediate-category-template.mjs <tenant-slug>");
  process.exit(1);
}

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_POOLED;
if (!url) {
  console.error("No DATABASE_URL in .env");
  process.exit(1);
}

const FOOD = new Set([
  "sarab",
  "foodmart",
  "fruitables",
  "organic",
  "blush-bakery",
  "simply-sweet",
  "street-cart",
]);

function preferred(category) {
  const c = (category || "").trim();
  if (/insurance|financial/i.test(c)) return "mono-market";
  if (/professional|consult/i.test(c)) return "mono-market";
  if (/food|catering/i.test(c)) return "sarab";
  if (/fashion/i.test(c)) return "bloom";
  if (/auto|car wash/i.test(c)) return "carserv";
  if (/print|photo/i.test(c)) return "studio";
  if (/furniture/i.test(c)) return "furnish";
  if (/pet/i.test(c)) return "waggy";
  if (/hotel|travel/i.test(c)) return "mellow";
  if (/electronic/i.test(c)) return "electro";
  return "clean-guma";
}

const sql = postgres(url, { ssl: "require", prepare: false });

const [tenant] = await sql`
  SELECT id, slug, name, category, theme_json, theme_draft_json, theme_published_json, store_dna_json
  FROM tenants
  WHERE slug = ${slug}
  LIMIT 1
`;

if (!tenant) {
  console.error(`Tenant not found: ${slug}`);
  await sql.end();
  process.exit(1);
}

const category = tenant.category || "General";
const nextTemplate = preferred(category);
const current =
  tenant.theme_published_json?.templateId ||
  tenant.theme_draft_json?.templateId ||
  tenant.theme_json?.templateId;

console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
console.log(`Category: ${category}`);
console.log(`Current template: ${current}`);
console.log(`Target template: ${nextTemplate}`);

if (current === nextTemplate && !FOOD.has(current)) {
  console.log("Already on a fit template — no change.");
  await sql.end();
  process.exit(0);
}

const professional = /insurance|financial|consult|professional/i.test(category);
const patch = {
  templateId: nextTemplate,
  patternId: nextTemplate === "mono-market" ? "classic" : nextTemplate,
  catalogId: null,
  catalogLabel: null,
  tagline: professional
    ? `Welcome to ${tenant.name}`
    : tenant.theme_draft_json?.tagline || tenant.theme_json?.tagline || `Welcome to ${tenant.name}`,
  promoTitle: professional
    ? "Book a consultation today"
    : tenant.theme_draft_json?.promoTitle || "Opening promo — talk to us",
  promoSubtitle: professional
    ? "Clear next steps · No pressure"
    : tenant.theme_draft_json?.promoSubtitle || "Local support",
  vibe: professional ? "premium" : tenant.theme_draft_json?.vibe || "fresh",
};

function mergeTheme(existing) {
  const base = existing && typeof existing === "object" ? { ...existing } : {};
  return {
    ...base,
    ...patch,
    catalogId: undefined,
    catalogLabel: undefined,
  };
}

const draft = mergeTheme(tenant.theme_draft_json || tenant.theme_json);
const published = tenant.theme_published_json
  ? mergeTheme(tenant.theme_published_json)
  : mergeTheme(tenant.theme_json);
const legacy = mergeTheme(tenant.theme_json);
const dna = {
  ...(tenant.store_dna_json || {}),
  category,
  vibe: patch.vibe,
  selectedTemplateId: nextTemplate,
};

await sql`
  UPDATE tenants
  SET
    theme_json = ${sql.json(legacy)},
    theme_draft_json = ${sql.json(draft)},
    theme_published_json = ${sql.json(published)},
    store_dna_json = ${sql.json(dna)},
    updated_at = now()
  WHERE id = ${tenant.id}
`;

console.log("Updated theme_json / draft / published →", nextTemplate);
await sql.end();
