import { getShopTemplate, isShopTemplateId } from "./templates";
import { canUseTemplate } from "./resolve-theme";
import { getTemplatePackage, type TemplatePackageMetadata } from "./template-packages";
import type { StoreDNA, ProductCountHint } from "./store-dna";
import type { ShopTemplateId } from "./types";
import { SHOP_TEMPLATE_IDS } from "./types";
import { isShopVibeId } from "./brand-kit";
import { STOREFRONT_TEMPLATE_REGISTRY } from "./template-registry";
import {
  BUNDLE_2023_CATALOG,
  type BundleTemplateCatalogEntry,
} from "./bundle-catalog";
import { previewImageForCategory, previewImageForTemplate } from "./template-previews";

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
    ministore: 42,
    "mono-market": 38,
    zay: 34,
    electro: 28,
    bloom: 18,
  },
  "Auto Shop & Services": {
    electro: 42,
    ministore: 36,
    zay: 30,
    "street-cart": 18,
    "clean-guma": 12,
  },
  "Automotive Parts & Accessories": {
    electro: 44,
    ministore: 34,
    zay: 28,
  },
  "Car Wash & Detailing": {
    electro: 36,
    ministore: 32,
    "clean-guma": 22,
    mellow: 16,
  },
  "Professional & Consulting": {
    "mono-market": 36,
    ministore: 30,
    bloom: 22,
    "clean-guma": 18,
  },
  Electronics: { electro: 48, ministore: 30, zay: 22 },
  "Fashion & Apparel": { bloom: 44, kaira: 42, stylish: 38, zay: 24 },
  "Food & Beverage": { sarab: 44, foodmart: 36, fruitables: 34, "blush-bakery": 28 },
  "Furniture & Home": { furnish: 48, "mono-market": 20 },
  "Pet Supplies & Lovers": { waggy: 48 },
  "Organic & Farm Produce": { organic: 46, fruitables: 42 },
  "Hotels & Resorts": { mellow: 46 },
  "Travel & Tours": { mellow: 40, "clean-guma": 16 },
  "Retail & General Merchandise": { zay: 40, ministore: 34, electro: 22 },
  "Beauty & Skincare": { bloom: 34, kaira: 28, "magazine-rack": 24 },
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
  const cat = category.toLowerCase();
  let score = 0;

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
  if (/print|sign|graphic|press|banner/i.test(category) && ["ministore", "mono-market", "zay", "electro"].includes(id)) {
    score = Math.max(score, 30);
  }
  if (/auto|car|vehicle|motor|detail|garage|spa/i.test(category) && ["electro", "ministore", "zay"].includes(id)) {
    score = Math.max(score, 30);
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
  if (/bakery|cake|sweet|pastry/.test(name) && ["blush-bakery", "simply-sweet", "sarab"].includes(id)) {
    return 12;
  }
  return 0;
}

function libraryBoostForLiveId(id: ShopTemplateId, category: string): {
  score: number;
  entry?: BundleTemplateCatalogEntry;
} {
  const cat = normalizeCategory(category);
  const matches = BUNDLE_2023_CATALOG.filter((e) => {
    if (e.shopCategory === cat) return true;
    // Soft: Printing shops often map near retail / professional catalog entries
    if (cat === "Printing & Signage") {
      return (
        e.shopCategory === "Retail & General Merchandise" ||
        e.shopCategory === "Professional & Consulting" ||
        /print|sign|graphic|design|studio/i.test(e.label + e.notes)
      );
    }
    if (cat.startsWith("Auto") || cat.includes("Car Wash")) {
      return e.shopCategory === "Auto Shop & Services" || /car|auto|moto|driv/i.test(e.label);
    }
    return false;
  });

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
  return { score, entry: best };
}

function resolveInstallId(entry: BundleTemplateCatalogEntry): ShopTemplateId | null {
  const candidates = [entry.similarIntegratedId, entry.proposedId];
  for (const c of candidates) {
    if (c && isShopTemplateId(c)) return c;
  }
  // Category fallbacks for queued verticals not yet ported
  if (entry.shopCategory === "Auto Shop & Services") return "electro";
  if (entry.shopCategory === "Printing & Signage") return "ministore";
  if (entry.shopCategory === "Electronics") return "electro";
  if (entry.shopCategory === "Fashion & Apparel") return "bloom";
  if (entry.shopCategory === "Food & Beverage") return "sarab";
  return null;
}

/**
 * Deterministic template recommendation — zero LLM.
 * Scores the live installable library (23+) against Store DNA, boosted by
 * Free Bundle 2023 catalog matches for the merchant category.
 */
export function recommendTemplates(
  dna: StoreDNA,
  options?: { plan?: string | null; limit?: number }
): RankedTemplate[] {
  const plan = options?.plan ?? "free";
  const limit = options?.limit ?? 3;
  const category = dna.category || "General";

  const ranked: RankedTemplate[] = [];

  for (const id of SHOP_TEMPLATE_IDS) {
    const pkg = getTemplatePackage(id);
    const template = getShopTemplate(id);
    const library = libraryBoostForLiveId(id, category);

    const breakdown: TemplateScoreBreakdown = {
      category: categoryScore(pkg, category, id),
      vibe: vibeScore(pkg, String(dna.vibe)),
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
      businessNameBoost(id, dna.businessName);

    const reasons: string[] = [];
    if (breakdown.category >= 28) reasons.push(`Strong fit for ${category}`);
    else if (breakdown.category >= 18) reasons.push(`Good match for ${category}`);
    if (library.entry) {
      reasons.push(`Library: ${library.entry.label} (#${library.entry.num})`);
    }
    if (breakdown.vibe >= 16) reasons.push(`Matches your ${dna.vibe} vibe`);
    if (pkg.liveSellingReady && dna.goals?.includes("live_selling")) {
      reasons.push("Live-selling ready");
    }
    if (pkg.mobileScore >= 88) reasons.push("Excellent on mobile");
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

  // Ensure category-matched Free Bundle entries surface via their install target
  const bundleHits = BUNDLE_2023_CATALOG.filter((e) => {
    if (e.shopCategory === category) return true;
    if (category === "Printing & Signage") {
      return /print|sign|graphic|design|studio|agency/i.test(
        `${e.label} ${e.notes} ${e.shopCategory}`
      );
    }
    return false;
  }).slice(0, 12);

  for (const entry of bundleHits) {
    const installId = resolveInstallId(entry);
    if (!installId) continue;
    const existing = ranked.find((r) => r.id === installId);
    if (!existing) continue;
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
    if (entry.shopCategory === category || category === "Printing & Signage") {
      existing.previewImageUrl = previewImageForCategory(category);
    }
  }

  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  // Prefer installable picks in the Top N, but never collapse to unrelated Basic skins
  // when a stronger locked industry template exists — show it with upgrade cue.
  const top = ranked.slice(0, Math.max(limit * 3, 9));
  const preferred: RankedTemplate[] = [];
  for (const item of top) {
    if (preferred.length >= limit) break;
    preferred.push(item);
  }
  return preferred;
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
    if (e.shopCategory === category) return true;
    if (category === "Printing & Signage") {
      return /print|sign|graphic|design|studio|agency|retail/i.test(
        `${e.label} ${e.notes} ${e.shopCategory}`
      );
    }
    if (category.startsWith("Auto") || category.includes("Car Wash")) {
      return e.shopCategory === "Auto Shop & Services" || /car|auto|moto|driv/i.test(e.label);
    }
    return false;
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
