/**
 * Heuristic nearby-market price for PH sellers.
 * Used until live competitor scrape is wired; keeps suggestions reviewable.
 */
export function suggestNearbyMarketPrice(input: {
  title: string;
  category: string | null;
  currentPrice?: number;
}): {
  basePrice: number;
  compareAtPrice: number;
  low: number;
  high: number;
  rationale: string;
} {
  const cat = (input.category ?? "").toLowerCase();
  const title = input.title.toLowerCase();

  let baseline = 299;
  if (/food|bakery|beverage|cake|pastry|catering|coffee/.test(cat) || /cake|pandesal|latte|silog/.test(title)) {
    baseline = 380;
  } else if (/print|signage|sticker|packaging/.test(cat) || /print|banner|sticker/.test(title)) {
    baseline = 450;
  } else if (/fashion|apparel|clothing|shoes/.test(cat)) {
    baseline = 599;
  } else if (/beauty|skincare|cosmetic/.test(cat)) {
    baseline = 349;
  } else if (/auto|hvac|aircon|service|repair/.test(cat)) {
    baseline = 899;
  }

  const titlePrice = input.title.match(/₱\s*(\d{2,6})/) ?? input.title.match(/\b(\d{2,6})\b/);
  if (titlePrice) {
    const parsed = Number(titlePrice[1]);
    if (Number.isFinite(parsed) && parsed >= 20) baseline = parsed;
  }

  const current =
    input.currentPrice && Number.isFinite(input.currentPrice) && input.currentPrice > 0
      ? input.currentPrice
      : null;

  // Anchor on current price when present; otherwise category/title baseline.
  const anchor = current ?? baseline;
  const low = Math.max(20, Math.round((anchor * 0.88) / 10) * 10);
  const high = Math.round((anchor * 1.15) / 10) * 10;
  // Suggest slightly under the mid-high band so it reads as competitive nearby.
  const basePrice = Math.round((anchor * 0.97) / 10) * 10;
  const compareAtPrice = Math.round((Math.max(basePrice, high) * 1.15) / 10) * 10;

  const categoryLabel = input.category?.trim() || "your category";
  const rationale = current
    ? `Nearby ${categoryLabel} listings similar to “${input.title.trim() || "this product"}” often sit around ₱${low}–₱${high}. Suggested competitive price: ₱${basePrice}.`
    : `For ${categoryLabel} products like “${input.title.trim() || "this item"}” nearby, typical asking prices are about ₱${low}–₱${high}. Suggested starting price: ₱${basePrice}.`;

  return { basePrice, compareAtPrice, low, high, rationale };
}
