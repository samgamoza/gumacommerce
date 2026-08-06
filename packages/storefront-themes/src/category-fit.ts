/**
 * Category ↔ live template fit.
 * Prevents cross-vertical disasters (e.g. Insurance shop on a food menu skin).
 */
import type { ShopTemplateId } from "./types";

/** Templates whose chrome/copy is food-specific — never assign outside food verticals. */
export const FOOD_VERTICAL_TEMPLATE_IDS: readonly ShopTemplateId[] = [
  "sarab",
  "foodmart",
  "fruitables",
  "organic",
  "blush-bakery",
  "simply-sweet",
  "street-cart",
] as const;

const FOOD_VERTICAL_SET = new Set<string>(FOOD_VERTICAL_TEMPLATE_IDS);

export function isFoodVerticalTemplate(id: string): boolean {
  return FOOD_VERTICAL_SET.has(id);
}

export function isFoodBusinessCategory(category: string): boolean {
  const c = category.trim().toLowerCase();
  return (
    c === "food & beverage" ||
    c === "catering" ||
    c === "grocery & supermarket" ||
    c === "organic & farm produce" ||
    /bakery|pastry|restaurant|cafe|café|kitchen|beverage|catering/.test(c)
  );
}

/**
 * Ordered live template preferences for a seller business category.
 * First installable entry wins at signup / gap-fill.
 */
export function preferredTemplatesForCategory(category: string): ShopTemplateId[] {
  const c = category.trim();

  if (c === "Insurance & Financial Services" || /insurance|financial|fintech|banking|lending/i.test(c)) {
    return ["mono-market", "clean-guma", "magazine-rack", "mellow", "studio"];
  }
  if (c === "Professional & Consulting" || /consult|agency|accountant|lawyer|legal/i.test(c)) {
    return ["mono-market", "clean-guma", "magazine-rack", "studio", "ministore"];
  }
  if (c === "Food & Beverage" || c === "Catering") {
    return ["sarab", "foodmart", "fruitables", "blush-bakery", "simply-sweet", "clean-guma"];
  }
  if (c === "Grocery & Supermarket") return ["foodmart", "fruitables", "organic", "zay"];
  if (c === "Organic & Farm Produce") return ["organic", "fruitables", "foodmart"];
  if (c === "Fashion & Apparel") return ["bloom", "kaira", "stylish", "zay"];
  if (c === "Shoes & Footwear") return ["stylish", "bloom", "zay"];
  if (c === "Beauty & Skincare" || c === "Beauty Salons & Spas" || c === "Barber & Hair Salons") {
    return ["bloom", "kaira", "magazine-rack", "mellow"];
  }
  if (
    c === "Auto Shop & Services" ||
    c === "Automotive Parts & Accessories" ||
    c === "Car Wash & Detailing" ||
    c === "Auto Body & Painting"
  ) {
    return ["carserv", "motto", "electro", "ministore"];
  }
  if (c === "Printing & Signage" || c === "Photography & Creative") {
    return ["studio", "ministore", "mono-market", "zay"];
  }
  if (
    c === "HVAC & Air Conditioning" ||
    c === "Appliance & Device Repair" ||
    c === "Home Services & Trades" ||
    c === "House Painting & Decorating" ||
    c === "Pest Control" ||
    c === "Construction & Renovation"
  ) {
    return ["aircon", "clean-guma", "carserv"];
  }
  if (c === "Electronics") return ["electro", "ministore", "zay"];
  if (c === "Furniture & Home") return ["furnish", "mono-market", "zay"];
  if (c === "Pet Supplies & Lovers") return ["waggy", "zay", "clean-guma"];
  if (c === "Hotels & Resorts" || c === "Travel & Tours") return ["mellow", "clean-guma", "mono-market"];
  if (c === "Retail & General Merchandise" || c === "Wholesale & B2B") {
    return ["zay", "ministore", "electro", "mono-market"];
  }
  if (c === "Healthcare & Clinics" || c === "Fitness & Wellness") {
    return ["mellow", "mono-market", "clean-guma"];
  }
  if (c === "Education & Training" || c === "Childcare & Education") {
    return ["mono-market", "clean-guma", "studio"];
  }
  if (c === "Real Estate & Property") return ["mellow", "furnish", "mono-market"];
  if (c === "Logistics & Shipping") return ["ministore", "clean-guma", "electro"];
  if (c === "Solar & Renewable Energy" || c === "Security & Surveillance") {
    return ["aircon", "electro", "clean-guma"];
  }
  if (c === "Cleaning & Janitorial" || c === "Landscaping & Gardening") {
    return ["aircon", "clean-guma", "organic"];
  }
  if (
    c === "Events & Entertainment" ||
    c === "Wedding Planning & Events" ||
    c === "Attractions & Leisure"
  ) {
    return ["mellow", "studio", "clean-guma"];
  }
  if (c === "Industrial & Manufacturing") return ["ministore", "electro", "mono-market"];
  if (c === "Camping & Adventures") return ["motto", "mellow", "zay"];
  if (c === "Handmade & Crafts") return ["bloom", "kaira", "zay"];

  return ["clean-guma", "mono-market", "zay", "ministore"];
}

/**
 * True when this live template is acceptable for the seller category.
 * Strict: only the category shortlist — vibe never reopens the whole catalog.
 */
export function templateFitsCategory(templateId: string, category: string): boolean {
  if (isFoodVerticalTemplate(templateId) && !isFoodBusinessCategory(category)) {
    return false;
  }
  return preferredTemplatesForCategory(category).includes(templateId as ShopTemplateId);
}

/**
 * Filter a candidate pool to category-safe templates.
 * If the pool empties, fall back to preferredTemplatesForCategory.
 */
export function filterTemplatesForCategory(
  candidates: readonly ShopTemplateId[],
  category: string
): ShopTemplateId[] {
  const fitted = candidates.filter((id) => templateFitsCategory(id, category));
  if (fitted.length > 0) return fitted;
  return preferredTemplatesForCategory(category);
}

/**
 * Signup / seed pool: category shortlist only.
 * Vibe may reorder within that shortlist (palette/tie-break), never expand it.
 */
export function templatePoolForSignup(
  category: string,
  vibeTemplates: readonly ShopTemplateId[]
): ShopTemplateId[] {
  const preferred = preferredTemplatesForCategory(category);
  const preferredSet = new Set(preferred);
  const vibeFirst = vibeTemplates.filter((id) => preferredSet.has(id));
  const rest = preferred.filter((id) => !vibeFirst.includes(id));
  return [...vibeFirst, ...rest];
}

/** Default live renderer from onboarding category (ops gap-fill + catalog fallback). */
export function liveTemplateForCategory(category: string): ShopTemplateId {
  return preferredTemplatesForCategory(category)[0] ?? "clean-guma";
}
