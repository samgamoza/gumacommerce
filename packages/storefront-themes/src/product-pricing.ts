/**
 * Category-aware product pricing chrome for seller admin + storefront labels.
 * Services ≠ retail cart pricing; food needs a sell unit (pc / box / custom).
 */
import { isFoodBusinessCategory } from "./category-fit";
import { isServiceBusinessCategory } from "./commerce-chrome";

export type ProductPricingKind = "retail" | "food" | "service";
export type ProductUnitType = "pc" | "box" | "other";
export type ServicePriceStyle = "base_minimum" | "value_range";

export type ProductPricingMeta = {
  unitType?: ProductUnitType;
  /** When unitType is "other" */
  unitCustom?: string;
  servicePriceStyle?: ServicePriceStyle;
};

export function productPricingKindForCategory(
  category: string | null | undefined
): ProductPricingKind {
  const c = category?.trim() ?? "";
  if (!c) return "retail";
  if (isFoodBusinessCategory(c)) return "food";
  if (isServiceBusinessCategory(c)) return "service";
  return "retail";
}

/**
 * Prefer shop category; fall back to seller-saved product meta / listing title
 * when category is still a legacy retail bucket (e.g. repair shop as Electronics).
 */
export function productPricingKindForProduct(
  category: string | null | undefined,
  meta?: ProductPricingMeta | null,
  hints?: { title?: string | null; slug?: string | null }
): ProductPricingKind {
  const fromCategory = productPricingKindForCategory(category);
  if (fromCategory !== "retail") return fromCategory;
  if (meta?.servicePriceStyle) return "service";
  if (meta?.unitType) return "food";
  const hay = `${hints?.title ?? ""} ${hints?.slug ?? ""}`.toLowerCase();
  if (
    hay.includes("repair") ||
    hay.includes("service package") ||
    hay.includes("installation") ||
    hay.includes("maintenance")
  ) {
    return "service";
  }
  return "retail";
}

export function formatProductUnitLabel(meta?: ProductPricingMeta | null): string | null {
  if (!meta?.unitType) return null;
  if (meta.unitType === "pc") return "per pc";
  if (meta.unitType === "box") return "per box";
  const custom = meta.unitCustom?.trim();
  return custom ? `per ${custom}` : "per unit";
}

/** Storefront / list line for a price given category + meta. */
export function formatProductPriceLine(input: {
  category: string | null | undefined;
  basePrice: number;
  compareAtPrice?: number | null;
  meta?: ProductPricingMeta | null;
  formatMoney: (n: number) => string;
}): string {
  return resolveProductPriceDisplay(input).priceLine;
}

/** Full card/PDP price chrome — safe for grids (no functions). */
export function resolveProductPriceDisplay(input: {
  category: string | null | undefined;
  basePrice: number;
  compareAtPrice?: number | null;
  meta?: ProductPricingMeta | null;
  formatMoney: (n: number) => string;
  title?: string | null;
  slug?: string | null;
}): {
  kind: ProductPricingKind;
  priceLine: string;
  /** Retail compare-at only; null for service ranges (already in priceLine). */
  compareAtLine: string | null;
  /** Short caption under the price (Base / minimum, per pc, …). */
  priceCaption: string | null;
} {
  const kind = productPricingKindForProduct(input.category, input.meta, {
    title: input.title,
    slug: input.slug,
  });
  const money = input.formatMoney;
  const base = input.basePrice;
  const max = input.compareAtPrice;

  if (kind === "service") {
    const style = input.meta?.servicePriceStyle ?? "base_minimum";
    if (style === "value_range" && max && max > base) {
      return {
        kind,
        priceLine: `${money(base)} – ${money(max)}`,
        compareAtLine: null,
        priceCaption: "Typical service value",
      };
    }
    return {
      kind,
      priceLine: `From ${money(base)}`,
      compareAtLine: null,
      priceCaption: "Base / minimum",
    };
  }

  const unit = formatProductUnitLabel(input.meta);
  if (kind === "food") {
    return {
      kind,
      priceLine: unit ? `${money(base)} ${unit}` : money(base),
      compareAtLine: max && max > base ? money(max) : null,
      priceCaption: unit,
    };
  }

  return {
    kind,
    priceLine: money(base),
    compareAtLine: max && max > base ? money(max) : null,
    priceCaption: null,
  };
}
