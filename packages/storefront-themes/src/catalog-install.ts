/**
 * Resolve Free Bundle curated skins → installable live storefront renderers.
 * Sellers pick a curated catalog identity; we mount the nearest live template
 * and keep catalogId/label + a unique storeLook so shops don't clone.
 */
import {
  BUNDLE_2023_CATALOG,
  getBundleCatalogEntry,
  type BundleTemplateCatalogEntry,
} from "./bundle-catalog";
import { preferredTemplatesForCategory } from "./category-fit";
import { canUseTemplate } from "./resolve-theme";
import { deriveStoreLook } from "./store-look";
import { isShopTemplateId } from "./templates";
import { previewImageForCategory, previewImageForTemplate } from "./template-previews";
import type { ShopTemplateId } from "./types";
import type { StoreLook } from "./store-look";
import type { StoreDNA } from "./store-dna";

const NON_SELLER_STATUSES = new Set([
  "admin-dashboard",
  "content-media",
  "non-storefront",
]);

/** FNV-1a — stable seed from catalog id / slug. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function resolveLiveTemplateForCatalogEntry(
  entry: BundleTemplateCatalogEntry
): ShopTemplateId | null {
  const candidates = [entry.similarIntegratedId, entry.proposedId];
  for (const c of candidates) {
    if (c && isShopTemplateId(c)) return c;
  }
  return defaultLiveTemplateForCategory(entry.shopCategory);
}

/** Nearest live renderer for a seller business category (ops seed + catalog fallback). */
export function defaultLiveTemplateForCategory(category: string): ShopTemplateId {
  return preferredTemplatesForCategory(category)[0] ?? "clean-guma";
}

/** Seller-ready Free Bundle counts keyed by shopCategory (excludes admin/content/non-storefront). */
export function countBundleSellerReadyByCategory(): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of BUNDLE_2023_CATALOG) {
    if (NON_SELLER_STATUSES.has(entry.status)) continue;
    map.set(entry.shopCategory, (map.get(entry.shopCategory) ?? 0) + 1);
  }
  return map;
}

export interface CatalogInstallResolution {
  /** What the seller picked (catalog proposedId or live template id). */
  selectionId: string;
  /** Live renderer to mount. */
  liveTemplateId: ShopTemplateId;
  catalogEntry: BundleTemplateCatalogEntry | null;
  catalogId: string | null;
  catalogLabel: string | null;
  /** Distinct look knobs derived from the curated pick. */
  storeLook: StoreLook;
  previewImageUrl: string;
  installableOnPlan: boolean;
  /** True when selection is a curated catalog skin (not a bare live id). */
  fromCatalog: boolean;
}

/**
 * Resolve a Launch selection: live ShopTemplateId and/or Free Bundle proposedId.
 */
export function resolveCatalogInstall(
  selectionId: string,
  options?: { plan?: string | null }
): CatalogInstallResolution | null {
  const id = selectionId.trim();
  if (!id) return null;

  const entry =
    getBundleCatalogEntry(id) ??
    BUNDLE_2023_CATALOG.find((e) => e.proposedId === id || String(e.num) === id) ??
    null;

  if (entry) {
    if (NON_SELLER_STATUSES.has(entry.status)) return null;
    const liveTemplateId = resolveLiveTemplateForCatalogEntry(entry);
    if (!liveTemplateId) return null;
    const seed = hashString(`catalog::${entry.proposedId}`);
    return {
      selectionId: entry.proposedId,
      liveTemplateId,
      catalogEntry: entry,
      catalogId: entry.proposedId,
      catalogLabel: entry.label,
      storeLook: deriveStoreLook(seed),
      previewImageUrl: previewImageForCategory(entry.shopCategory),
      installableOnPlan: canUseTemplate(liveTemplateId, options?.plan ?? "free"),
      fromCatalog: true,
    };
  }

  if (!isShopTemplateId(id)) return null;
  const seed = hashString(`live::${id}`);
  return {
    selectionId: id,
    liveTemplateId: id,
    catalogEntry: null,
    catalogId: null,
    catalogLabel: null,
    storeLook: deriveStoreLook(seed),
    previewImageUrl: previewImageForTemplate(id),
    installableOnPlan: canUseTemplate(id, options?.plan ?? "free"),
    fromCatalog: false,
  };
}

export interface CuratedTemplateCard {
  proposedId: string;
  label: string;
  shopCategory: string;
  status: BundleTemplateCatalogEntry["status"];
  notes: string;
  previewImageUrl: string;
  installTemplateId: ShopTemplateId;
  installable: boolean;
  /** Live package label sellers will actually get. */
  usesLiveLabel: string;
  num: number;
}

function categoryMatches(entryCategory: string, sellerCategory: string): boolean {
  if (entryCategory === sellerCategory) return true;
  if (sellerCategory === "Printing & Signage") {
    return /print|sign|graphic|design|studio|agency|retail/i.test(entryCategory);
  }
  if (sellerCategory.startsWith("Auto") || sellerCategory.includes("Car Wash")) {
    return (
      entryCategory === "Auto Shop & Services" ||
      entryCategory === "Automotive Parts & Accessories" ||
      entryCategory === "Car Wash & Detailing"
    );
  }
  if (sellerCategory === "Catering") return entryCategory === "Food & Beverage";
  if (sellerCategory === "Shoes & Footwear") {
    return entryCategory === "Fashion & Apparel" || entryCategory === "Retail & General Merchandise";
  }
  if (sellerCategory === "Beauty Salons & Spas" || sellerCategory === "Barber & Hair Salons") {
    return entryCategory === "Beauty & Skincare" || entryCategory === "Fitness & Wellness";
  }
  return false;
}

/**
 * Full curated gallery for a seller category — every installable Free Bundle skin
 * mapped to a live renderer. This is how the 100-template library benefits sellers today.
 */
export function listCuratedTemplatesForDna(
  dna: StoreDNA,
  options?: { plan?: string | null; limit?: number }
): CuratedTemplateCard[] {
  const category = dna.category || "General";
  const plan = options?.plan ?? "free";
  const limit = options?.limit ?? 48;

  const cards: CuratedTemplateCard[] = [];
  for (const entry of BUNDLE_2023_CATALOG) {
    if (NON_SELLER_STATUSES.has(entry.status)) continue;
    if (!categoryMatches(entry.shopCategory, category)) continue;
    const live = resolveLiveTemplateForCatalogEntry(entry);
    if (!live) continue;
    cards.push({
      proposedId: entry.proposedId,
      label: entry.label,
      shopCategory: entry.shopCategory,
      status: entry.status,
      notes: entry.notes,
      previewImageUrl: previewImageForCategory(entry.shopCategory),
      installTemplateId: live,
      installable: canUseTemplate(live, plan),
      usesLiveLabel: live,
      num: entry.num,
    });
  }

  // Prefer integrated / variants first, then queued, then service landings
  const rank = (s: BundleTemplateCatalogEntry["status"]) => {
    if (s === "integrated") return 0;
    if (s === "variant-of-integrated") return 1;
    if (s === "queued-storefront") return 2;
    if (s === "service-landing") return 3;
    return 9;
  };
  cards.sort((a, b) => rank(a.status) - rank(b.status) || a.num - b.num);
  return cards.slice(0, limit);
}

/** Platform ops: full catalog grouped by category. */
export function listCatalogByCategory(): Array<{
  category: string;
  entries: BundleTemplateCatalogEntry[];
}> {
  const map = new Map<string, BundleTemplateCatalogEntry[]>();
  for (const entry of BUNDLE_2023_CATALOG) {
    const list = map.get(entry.shopCategory) ?? [];
    list.push(entry);
    map.set(entry.shopCategory, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, entries]) => ({
      category,
      entries: entries.sort((a, b) => a.num - b.num),
    }));
}
