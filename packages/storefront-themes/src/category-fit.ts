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
  if (c === "Auto Shop & Services" || c === "Automotive Parts & Accessories" || c === "Car Wash & Detailing") {
    return ["carserv", "motto", "electro", "ministore"];
  }
  if (c === "Printing & Signage" || c === "Photography & Creative") {
    return ["studio", "ministore", "mono-market", "zay"];
  }
  if (c === "HVAC & Air Conditioning" || c === "Home Services & Trades" || c === "Construction & Renovation") {
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
  if (c === "Events & Entertainment" || c === "Attractions & Leisure") {
    return ["mellow", "studio", "clean-guma"];
  }
  if (c === "Industrial & Manufacturing") return ["ministore", "electro", "mono-market"];
  if (c === "Camping & Adventures") return ["motto", "mellow", "zay"];
  if (c === "Handmade & Crafts") return ["bloom", "kaira", "zay"];

  return ["clean-guma", "mono-market", "zay", "ministore"];
}

/** True when this live template is acceptable for the seller category. */
export function templateFitsCategory(templateId: string, category: string): boolean {
  if (isFoodVerticalTemplate(templateId) && !isFoodBusinessCategory(category)) {
    return false;
  }
  const preferred = preferredTemplatesForCategory(category);
  if (preferred.includes(templateId as ShopTemplateId)) return true;
  // Non-food vertical templates are OK as soft fallbacks if not food-locked
  if (!isFoodVerticalTemplate(templateId)) return true;
  return false;
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

/** Merge category prefs ahead of vibe prefs for signup. */
export function templatePoolForSignup(
  category: string,
  vibeTemplates: readonly ShopTemplateId[]
): ShopTemplateId[] {
  const preferred = preferredTemplatesForCategory(category);
  const vibeSafe = filterTemplatesForCategory(vibeTemplates, category);
  const seen = new Set<ShopTemplateId>();
  const pool: ShopTemplateId[] = [];
  for (const id of [...preferred, ...vibeSafe]) {
    if (seen.has(id)) continue;
    seen.add(id);
    pool.push(id);
  }
  return pool;
}
