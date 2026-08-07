import { getShopTemplate, isShopTemplateId } from "./templates";
import { canUseTemplate } from "./resolve-theme";
import { getTemplatePackage, type TemplatePackageMetadata } from "./template-packages";
import type { StoreDNA, ProductCountHint } from "./store-dna";
import type { ShopTemplateId } from "./types";
import { isShopVibeId } from "./brand-kit";
import { STOREFRONT_TEMPLATE_REGISTRY } from "./template-registry";
import {
  BUNDLE_2023_CATALOG,
  type BundleTemplateCatalogEntry,
} from "./bundle-catalog";
import { previewImageForCategory, previewImageForTemplate } from "./template-previews";
import {
  isFoodBusinessCategory,
  isFoodVerticalTemplate,
  preferredTemplatesForCategory,
  templateFitsCategory,
} from "./category-fit";

export interface TemplateScoreBreakdown {
  category: number;
  vibe: number;
  productCount: number;
  goals: number;
  plan: number;
  quality: number;
  library: number;
}

export interface RankedTemplate {
  id: ShopTemplateId;
  label: string;
  description: string;
  mood: string;
  previewGradient: string;
  /** Real still / hero used in Launch cards */
  previewImageUrl: string;
  score: number;
  breakdown: TemplateScoreBreakdown;
  package: TemplatePackageMetadata;
  reasons: string[];
  /** False when plan cannot install (still shown so curation is honest). */
  installable: boolean;
  minPlan: "free" | "growth" | "pro";
  tier: "basic" | "standard" | "advanced";
  /** When recommendation came via Free Bundle catalog match */
  librarySource?: {
    proposedId: string;
    label: string;
    status: BundleTemplateCatalogEntry["status"];
    bundleFile: string;
  };
}

/** Strong industry → live template affinity (until every bundle entry is ported). */
const CATEGORY_AFFINITY: Record<string, Partial<Record<ShopTemplateId, number>>> = {
  "Printing & Signage": {
    studio: 48,
    ministore: 36,
    "mono-market": 32,
    zay: 28,
    electro: 22,
  },
  "Auto Shop & Services": {
    carserv: 48,
    motto: 42,
    electro: 30,
    ministore: 24,
    zay: 20,
  },
  "Automotive Parts & Accessories": {
    carserv: 44,
    electro: 36,
    ministore: 28,
    motto: 26,
  },
  "Car Wash & Detailing": {
    carserv: 44,
    electro: 30,
    ministore: 26,
    "clean-guma": 18,
  },
  "Auto Body & Painting": {
    carserv: 48,
    motto: 36,
    electro: 28,
    ministore: 22,
  },
  "HVAC & Air Conditioning": {
    aircon: 50,
    mellow: 18,
    "clean-guma": 14,
  },
  "Appliance & Device Repair": {
    specialty: 50,
    aircon: 40,
    electro: 36,
    carserv: 24,
    "clean-guma": 18,
  },
  "Barber & Hair Salons": {
    haircut: 50,
    specialty: 28,
    mellow: 18,
    studio: 16,
  },
  "Beauty Salons & Spas": {
    haircut: 48,
    specialty: 30,
    mellow: 22,
    studio: 18,
  },
  "Home Services & Trades": {
    aircon: 40,
    carserv: 28,
    "clean-guma": 22,
  },
  "House Painting & Decorating": {
    aircon: 42,
    "clean-guma": 28,
    carserv: 22,
  },
  "Pest Control": {
    aircon: 44,
    "clean-guma": 30,
    mellow: 18,
  },
  "Wedding Planning & Events": {
    mellow: 46,
    studio: 40,
    "clean-guma": 24,
  },
  "Landscaping & Gardening": {
    aircon: 36,
    organic: 32,
    "clean-guma": 28,
  },
  "Cleaning & Janitorial": {
    aircon: 38,
    "clean-guma": 32,
    mellow: 18,
  },
  "Photography & Creative": {
    studio: 50,
    furnish: 22,
    bloom: 18,
  },
  "Professional & Consulting": {
    "mono-market": 48,
    "clean-guma": 36,
    "magazine-rack": 32,
    studio: 28,
    ministore: 24,
  },
  "Insurance & Financial Services": {
    "mono-market": 50,
    "clean-guma": 40,
    "magazine-rack": 34,
    mellow: 28,
    studio: 24,
  },
  Electronics: { electro: 48, ministore: 30, zay: 22, specialty: 26 },
  "Fashion & Apparel": { bloom: 44, kaira: 42, stylish: 38, zay: 24 },
  "Food & Beverage": {
    sarab: 36,
    foodmart: 36,
    fruitables: 34,
    "blush-bakery": 36,
    "simply-sweet": 34,
    organic: 22,
  },
  "Furniture & Home": { furnish: 48, "mono-market": 20 },
  "Pet Supplies & Lovers": { waggy: 48 },
  "Organic & Farm Produce": { organic: 46, fruitables: 42 },
  "Hotels & Resorts": { mellow: 46 },
  "Travel & Tours": { mellow: 40, "clean-guma": 16 },
  "Retail & General Merchandise": { zay: 40, ministore: 34, electro: 22, motto: 18 },
  "Beauty & Skincare": { bloom: 34, kaira: 28, "magazine-rack": 24, specialty: 22 },
  "Healthcare & Clinics": { mellow: 40, "mono-market": 34, "clean-guma": 28 },
  "Real Estate & Property": { mellow: 42, furnish: 30, "mono-market": 28 },
  "Education & Training": { "mono-market": 40, "clean-guma": 32, studio: 26 },
};

const PRODUCT_COUNT_MID: Record<ProductCountHint, number> = {
  none: 0,
  "1-10": 5,
  "11-50": 30,
  "50+": 80,
};

function normalizeCategory(category: string): string {
  return category.trim();
}

function categoryScore(pkg: TemplatePackageMetadata, category: string, id: ShopTemplateId): number {
  // Hard veto — food chrome must never rank for insurance / professional / etc.
  if (!templateFitsCategory(id, category)) return 0;

  const cat = category.toLowerCase();
  let score = 0;

  const preferred = preferredTemplatesForCategory(category);
  const prefIdx = preferred.indexOf(id);
  if (prefIdx === 0) score = Math.max(score, 48);
  else if (prefIdx === 1) score = Math.max(score, 42);
  else if (prefIdx === 2) score = Math.max(score, 36);
  else if (prefIdx >= 0) score = Math.max(score, 28);

  if (pkg.industryFit.some((fit) => fit.toLowerCase() === cat)) score = Math.max(score, 40);
  else if (pkg.industryFit.some((fit) => cat.includes(fit.toLowerCase()) || fit.toLowerCase().includes(cat))) {
    score = Math.max(score, 28);
  } else {
    const tokens = cat.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    if (tokens.some((t) => pkg.industryFit.some((fit) => fit.toLowerCase().includes(t)))) {
      score = Math.max(score, 18);
    } else if (pkg.industryFit.includes("General")) {
      score = Math.max(score, 6);
    }
  }

  const affinity = CATEGORY_AFFINITY[normalizeCategory(category)]?.[id] ?? 0;
  score = Math.max(score, affinity);

  const registry = STOREFRONT_TEMPLATE_REGISTRY.find((e) => e.id === id);
  if (registry?.categoryHints.some((re) => re.test(category) || re.test(cat))) {
    score = Math.max(score, 32);
  }

  // Soft tokens for print / auto when category string is messy
  if (/print|sign|graphic|press|banner/i.test(category) && ["studio", "ministore", "mono-market", "zay"].includes(id)) {
    score = Math.max(score, 30);
  }
  if (
    /auto|car|vehicle|motor|detail|garage/i.test(category) &&
    !/barber|salon|spa|hair/i.test(category) &&
    ["carserv", "motto", "electro", "ministore"].includes(id)
  ) {
    score = Math.max(score, 30);
  }
  if (/hvac|air.?con|cooling|heating/i.test(category) && id === "aircon") {
    score = Math.max(score, 40);
  }
  if (/photo|studio|creative|print/i.test(category) && id === "studio") {
    score = Math.max(score, 36);
  }
  if (/barber|hair.?salon|haircut|beauty.?salon|grooming/i.test(category) && id === "haircut") {
    score = Math.max(score, 42);
  }
  if (
    /specialty|single.?product|flagship|phone.?repair|device.?repair|cellphone.?repair/i.test(category) &&
    id === "specialty"
  ) {
    score = Math.max(score, 40);
  }
  if (
    /insurance|financial|fintech|banking/i.test(category) &&
    ["mono-market", "clean-guma", "magazine-rack", "mellow"].includes(id)
  ) {
    score = Math.max(score, 44);
  }
  // Extra penalty if somehow a food skin still scores via soft token noise
  if (isFoodVerticalTemplate(id) && !isFoodBusinessCategory(category)) {
    return 0;
  }

  return Math.min(score, 48);
}

function vibeScore(pkg: TemplatePackageMetadata, vibe: string): number {
  if (!vibe) return 5;
  if (pkg.visualStyle.includes(vibe as never)) return 16;
  if (isShopVibeId(vibe) && pkg.visualStyle.length === 0) return 5;
  return 2;
}

function productCountScore(pkg: TemplatePackageMetadata, hint?: ProductCountHint): number {
  if (!hint || hint === "none") return 8;
  const mid = PRODUCT_COUNT_MID[hint];
  const { min, max } = pkg.idealProductCount;
  if (mid >= min && mid <= max) return 15;
  if (mid < min && mid >= min * 0.5) return 8;
  if (mid > max && mid <= max * 1.5) return 8;
  return 3;
}

function goalsScore(pkg: TemplatePackageMetadata, goals?: StoreDNA["goals"]): number {
  if (!goals?.length) return 5;
  let score = 0;
  if (goals.includes("live_selling") && pkg.liveSellingReady) score += 8;
  if (goals.includes("conversion") && pkg.conversionFocus === "catalog") score += 5;
  if (goals.includes("conversion") && pkg.conversionFocus === "menu") score += 5;
  if (goals.includes("brand_look") && pkg.conversionFocus === "editorial") score += 6;
  if (goals.includes("launch_fast") && pkg.mobileScore >= 85) score += 4;
  return Math.min(score, 15);
}

function businessNameBoost(id: ShopTemplateId, businessName: string): number {
  const name = businessName.toLowerCase();
  if (/print|sign|air|press|banner|graphic/.test(name) && ["ministore", "mono-market", "zay", "electro"].includes(id)) {
    return 12;
  }
  if (/auto|car|benz|motor|detail|garage|spa/.test(name) && ["electro", "ministore", "zay"].includes(id)) {
    return 12;
  }
  // Cake / bakery names: prefer sweet patterns over generic food Sarab.
  if (/bakery|cake|sweet|pastry|donut|dessert|bakeshop/.test(name)) {
    if (["blush-bakery", "simply-sweet"].includes(id)) return 16;
    if (id === "sarab") return 4;
  }
  return 0;
}

/** FNV-1a — match brand-kit seed so Launch diversifies like signup. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Soft rotation among competitive templates so two similar shops don't always
 * see the same #1. Zero LLM — seed from business name + category.
 */
function seedDiversityBoost(id: ShopTemplateId, seed: number, competitiveIds: ShopTemplateId[]): number {
  if (!competitiveIds.includes(id)) return 0;
  const preferred = competitiveIds[seed % competitiveIds.length];
  if (id === preferred) return 18;
  const second = competitiveIds[(seed + 1) % competitiveIds.length];
  if (id === second) return 10;
  return 0;
}

function competitivePoolForCategory(category: string): ShopTemplateId[] {
  const affinity = CATEGORY_AFFINITY[category];
  if (!affinity) return [];
  return (Object.entries(affinity) as [ShopTemplateId, number][])
    .filter(([, score]) => score >= 30)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .filter((id) => isShopTemplateId(id));
}

function occupiedPenalty(id: ShopTemplateId, occupied: Set<string>): number {
  if (!occupied.has(id)) return 0;
  // Soft — still recommendable, but nudged down so Top-3 spreads.
  return -24;
}

/**
 * Rotate near-tied category leaders by seed so similar shops don't always get
 * the same #1 — only rotate among strong category fits (not random skins).
 */
function spreadTopBySeed(
  ranked: RankedTemplate[],
  seed: number,
  limit: number,
  margin = 28
): RankedTemplate[] {
  if (ranked.length === 0) return ranked;
  const ceiling = ranked[0]!.score;
  const band = ranked.filter(
    (r) =>
      r.score >= ceiling - margin &&
      (r.breakdown.category >= 28 || r.breakdown.library >= 8)
  );
  const rest = ranked.filter((r) => !band.includes(r));
  if (band.length <= 1) return ranked.slice(0, limit);

  const offset = seed % band.length;
  const rotated = [...band.slice(offset), ...band.slice(0, offset)];
  return [...rotated, ...rest].slice(0, limit);
}

function libraryBoostForLiveId(id: ShopTemplateId, category: string): {
  score: number;
  entry?: BundleTemplateCatalogEntry;
} {
  const cat = normalizeCategory(category);
  // Exact category only — neighbor aliases live in catalog-install shortlist.
  const matches = BUNDLE_2023_CATALOG.filter((e) => e.shopCategory === cat);

  let best: BundleTemplateCatalogEntry | undefined;
  let score = 0;
  for (const entry of matches) {
    const target = entry.similarIntegratedId ?? entry.proposedId;
    if (target === id || (isShopTemplateId(target) && target === id)) {
      const bump =
        entry.status === "variant-of-integrated" || entry.status === "integrated" ? 22 : 16;
      if (bump > score) {
        score = bump;
        best = entry;
      }
    }
  }
  // Food catalog has many aliases of the same Sarab port — cap so peers can compete.
  if (cat === "Food & Beverage") {
    score = Math.min(score, 8);
  }
  return { score, entry: best };
}

function resolveInstallId(entry: BundleTemplateCatalogEntry): ShopTemplateId | null {
  const candidates = [entry.similarIntegratedId, entry.proposedId];
  for (const c of candidates) {
    if (c && isShopTemplateId(c)) return c;
  }
  // Category fallbacks for queued verticals not yet ported
  if (entry.shopCategory === "Auto Shop & Services") return "carserv";
  if (entry.shopCategory === "Printing & Signage") return "studio";
  if (entry.shopCategory === "HVAC & Air Conditioning") return "aircon";
  if (entry.shopCategory === "Photography & Creative") return "studio";
  if (entry.shopCategory === "Barber & Hair Salons" || entry.shopCategory === "Beauty Salons & Spas") {
    return "haircut";
  }
  if (entry.shopCategory === "Appliance & Device Repair") return "specialty";
  if (entry.shopCategory === "Electronics") return "electro";
  if (entry.shopCategory === "Fashion & Apparel") return "bloom";
  if (entry.shopCategory === "Food & Beverage") return "sarab";
  return null;
}

/**
 * Deterministic template recommendation — zero LLM.
 * Category from onboarding picks the shortlist; vibe only tie-breaks inside it.
 */
export function recommendTemplates(
  dna: StoreDNA,
  options?: {
    plan?: string | null;
    limit?: number;
    /** Recent same-category templateIds — soft-penalize so shops don't clone. */
    avoidTemplateIds?: string[] | null;
  }
): RankedTemplate[] {
  const plan = options?.plan ?? "free";
  const limit = options?.limit ?? 3;
  const category = dna.category || "General";
  const seed = hashString(`${dna.businessName.trim().toLowerCase()}::${category}`);
  const competitive = competitivePoolForCategory(category).filter((id) =>
    templateFitsCategory(id, category)
  );
  const occupied = new Set(
    (options?.avoidTemplateIds ?? []).map((id) => id.trim()).filter(Boolean)
  );

  // Score only the category shortlist — never reopen the full live library.
  const pool = preferredTemplatesForCategory(category);
  const ranked: RankedTemplate[] = [];

  for (const id of pool) {
    if (!templateFitsCategory(id, category)) continue;

    const pkg = getTemplatePackage(id);
    const template = getShopTemplate(id);
    const library = libraryBoostForLiveId(id, category);

    const breakdown: TemplateScoreBreakdown = {
      category: categoryScore(pkg, category, id),
      // Vibe is a light tie-break only (category already locked the pool).
      vibe: Math.min(8, vibeScore(pkg, String(dna.vibe))),
      productCount: productCountScore(pkg, dna.productCountHint),
      goals: goalsScore(pkg, dna.goals),
      plan: canUseTemplate(id, plan) ? 10 : 4,
      quality: Math.round((pkg.mobileScore + pkg.performanceScore) / 20),
      library: library.score,
    };

    const score =
      breakdown.category +
      breakdown.vibe +
      breakdown.productCount +
      breakdown.goals +
      breakdown.plan +
      breakdown.quality +
      breakdown.library +
      businessNameBoost(id, dna.businessName) +
      seedDiversityBoost(id, seed, competitive) +
      occupiedPenalty(id, occupied);

    const reasons: string[] = [];
    if (breakdown.category >= 28) reasons.push(`Made for ${category}`);
    else if (breakdown.category >= 18) reasons.push(`Fits ${category}`);
    if (library.entry) {
      reasons.push(`Library: ${library.entry.label} (#${library.entry.num})`);
    }
    if (pkg.liveSellingReady && dna.goals?.includes("live_selling")) {
      reasons.push("Live-selling ready");
    }
    if (pkg.mobileScore >= 88) reasons.push("Excellent on mobile");
    if (occupied.has(id)) reasons.push("Less common in your category right now");
    if (reasons.length === 0) reasons.push(template.mood);

    ranked.push({
      id,
      label: template.label,
      description: template.description,
      mood: template.mood,
      previewGradient: template.previewGradient,
      previewImageUrl: previewImageForTemplate(id),
      score,
      breakdown,
      package: pkg,
      reasons,
      installable: canUseTemplate(id, plan),
      minPlan: template.minPlan,
      tier: template.tier,
      librarySource: library.entry
        ? {
            proposedId: library.entry.proposedId,
            label: library.entry.label,
            status: library.entry.status,
            bundleFile: library.entry.bundleFile,
          }
        : undefined,
    });
  }

  // Exact-category Free Bundle bumps only (no regex bleed).
  const bundleHits = BUNDLE_2023_CATALOG.filter((e) => e.shopCategory === category).slice(
    0,
    12
  );

  const boostedInstallIds = new Set<ShopTemplateId>();
  for (const entry of bundleHits) {
    const installId = resolveInstallId(entry);
    if (!installId || boostedInstallIds.has(installId)) continue;
    const existing = ranked.find((r) => r.id === installId);
    if (!existing) continue;
    boostedInstallIds.add(installId);
    existing.score += 10;
    existing.breakdown.library = Math.max(existing.breakdown.library, 18);
    if (!existing.librarySource) {
      existing.librarySource = {
        proposedId: entry.proposedId,
        label: entry.label,
        status: entry.status,
        bundleFile: entry.bundleFile,
      };
      existing.reasons = [
        `Curated from Free Bundle: ${entry.label}`,
        ...existing.reasons.filter((r) => !r.startsWith("Library:")),
      ].slice(0, 4);
    }
    // Prefer category mood image when recommendation is driven by library vertical
    if (entry.shopCategory === category) {
      existing.previewImageUrl = previewImageForCategory(category);
    }
  }

  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  return spreadTopBySeed(ranked, seed, limit);
}

/** Category-matched Free Bundle entries for Launch “library” panel. */
export function listLibraryMatchesForDna(dna: StoreDNA, limit = 6): Array<{
  proposedId: string;
  label: string;
  shopCategory: string;
  status: BundleTemplateCatalogEntry["status"];
  notes: string;
  previewImageUrl: string;
  installTemplateId: ShopTemplateId | null;
}> {
  const category = dna.category || "General";
  const matches = BUNDLE_2023_CATALOG.filter((e) => {
    if (["admin-dashboard", "content-media", "non-storefront"].includes(e.status)) return false;
    return e.shopCategory === category;
  }).slice(0, limit);

  return matches.map((e) => ({
    proposedId: e.proposedId,
    label: e.label,
    shopCategory: e.shopCategory,
    status: e.status,
    notes: e.notes,
    previewImageUrl: previewImageForCategory(e.shopCategory),
    installTemplateId: resolveInstallId(e),
  }));
}
