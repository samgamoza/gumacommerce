/**
 * Onboarding category guide — plain language, aliases, groups.
 * Sellers search how they talk; we map to canonical ShopBusinessCategory labels.
 */
import {
  DEFAULT_SHOP_BUSINESS_CATEGORY,
  SHOP_BUSINESS_CATEGORIES,
  SHOP_CATEGORY_EMOJI,
  type ShopBusinessCategory,
} from "./shop-categories";

export type CategoryGroupId =
  | "food"
  | "retail"
  | "fashion"
  | "beauty"
  | "auto"
  | "home"
  | "health"
  | "services"
  | "travel"
  | "other";

export interface CategoryGroup {
  id: CategoryGroupId;
  label: string;
  blurb: string;
}

export interface CategoryGuideEntry {
  label: ShopBusinessCategory | string;
  group: CategoryGroupId;
  /** One short sentence a first-time seller understands. */
  plain: string;
  /** Everyday examples shown under the card. */
  examples: string[];
  /** Search aliases / vernacular (Taglish OK). */
  aliases: string[];
  /** Show in “Popular” row during onboarding. */
  popular?: boolean;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: "food", label: "Food & drink", blurb: "Cooked food, groceries, farms, catering" },
  { id: "retail", label: "Retail & shops", blurb: "General stores, wholesale, electronics, pets" },
  { id: "fashion", label: "Fashion", blurb: "Clothes, shoes, handmade, crafts" },
  { id: "beauty", label: "Beauty & care", blurb: "Skincare, salons, barbers, spas" },
  { id: "auto", label: "Auto & wheels", blurb: "Repair, parts, wash, moto gear" },
  { id: "home", label: "Home & build", blurb: "Furniture, trades, HVAC, solar, cleaning" },
  { id: "health", label: "Health & learn", blurb: "Clinics, fitness, schools, childcare" },
  { id: "services", label: "Pro services", blurb: "Insurance, consulting, print, photo, logistics" },
  { id: "travel", label: "Travel & fun", blurb: "Hotels, tours, events, attractions" },
  { id: "other", label: "Something else", blurb: "When nothing else fits — we’ll still help" },
];

/**
 * Canonical onboarding guide. Labels must match SHOP_BUSINESS_CATEGORIES
 * (or ops-added categories that use the same string).
 */
export const SHOP_CATEGORY_GUIDE: CategoryGuideEntry[] = [
  {
    label: "Food & Beverage",
    group: "food",
    plain: "You cook or sell food and drinks people order — restaurant, cafe, stall, or cloud kitchen.",
    examples: ["resto", "cafe", "burger stand", "milk tea", "carinderia"],
    aliases: [
      "food",
      "restaurant",
      "resto",
      "cafe",
      "coffee",
      "milk tea",
      "burger",
      "pizza",
      "carinderia",
      "lutong bahay",
      "kitchen",
      "fast food",
      "drinks",
      "beverage",
    ],
    popular: true,
  },
  {
    label: "Catering",
    group: "food",
    plain: "You cook for events and parties — trays, packages, packed meals for gatherings.",
    examples: ["wedding catering", "office meals", "fiesta trays"],
    aliases: ["catering", "party food", "packed meals", "event food", "banquet"],
  },
  {
    label: "Grocery & Supermarket",
    group: "food",
    plain: "Packaged goods and household essentials — mini-mart, grocery, or sari-sari at scale.",
    examples: ["mini mart", "sari-sari", "pantry goods"],
    aliases: ["grocery", "supermarket", "sari-sari", "minimart", "convenience", "pantry"],
    popular: true,
  },
  {
    label: "Organic & Farm Produce",
    group: "food",
    plain: "Fresh produce from farm or market — veggies, fruit, eggs, or organic goods.",
    examples: ["farm share", "gulay", "organic eggs"],
    aliases: ["farm", "organic", "produce", "gulay", "fruits", "vegetables", "agri"],
  },
  {
    label: "Retail & General Merchandise",
    group: "retail",
    plain: "A general shop selling mixed goods — not focused on one niche.",
    examples: ["gift shop", "variety store", "online thrift"],
    aliases: ["retail", "general merchandise", "variety", "gift shop", "ukay", "thrift", "shop"],
    popular: true,
  },
  {
    label: "Wholesale & B2B",
    group: "retail",
    plain: "You sell in bulk to other businesses or resellers — not mainly walk-in retail.",
    examples: ["distributor", "reseller packs", "bulk orders"],
    aliases: ["wholesale", "b2b", "distributor", "reseller", "bulk"],
  },
  {
    label: "Electronics",
    group: "retail",
    plain: "Phones, gadgets, accessories, or tech devices.",
    examples: ["cellphone accessories", "gadgets", "chargers"],
    aliases: ["electronics", "gadget", "phone", "cellphone", "tech", "laptop", "accessories"],
  },
  {
    label: "Pet Supplies & Lovers",
    group: "retail",
    plain: "Pet food, treats, toys, or pet care products.",
    examples: ["dog food", "cat litter", "pet shop"],
    aliases: ["pet", "dog", "cat", "pet shop", "veterinary supplies"],
  },
  {
    label: "Fashion & Apparel",
    group: "fashion",
    plain: "Clothes and apparel — RTW, streetwear, uniforms, or boutique fashion.",
    examples: ["RTW", "streetwear", "boutique"],
    aliases: ["fashion", "clothes", "apparel", "rtw", "clothing", "dress", "shirt", "boutique"],
    popular: true,
  },
  {
    label: "Shoes & Footwear",
    group: "fashion",
    plain: "Shoes, slippers, sneakers, or footwear brands.",
    examples: ["sneakers", "heels", "slippers"],
    aliases: ["shoes", "footwear", "sneakers", "slippers", "boots"],
  },
  {
    label: "Handmade & Crafts",
    group: "fashion",
    plain: "Handcrafted goods — jewelry, resin, crochet, custom crafts.",
    examples: ["resin art", "crochet", "custom gifts"],
    aliases: ["handmade", "crafts", "jewelry", "resin", "crochet", "custom gift"],
  },
  {
    label: "Beauty & Skincare",
    group: "beauty",
    plain: "You sell beauty or skincare products — not mainly a salon chair.",
    examples: ["skincare", "makeup", "soap"],
    aliases: ["beauty", "skincare", "makeup", "cosmetics", "soap", "serum"],
    popular: true,
  },
  {
    label: "Beauty Salons & Spas",
    group: "beauty",
    plain: "Salon or spa services — nails, lashes, facial, massage bookings.",
    examples: ["nail salon", "lash tech", "spa"],
    aliases: ["salon", "spa", "nails", "lashes", "facial", "massage", "manicure"],
  },
  {
    label: "Barber & Hair Salons",
    group: "beauty",
    plain: "Haircuts and barber services — men or women.",
    examples: ["barbershop", "haircut", "color"],
    aliases: ["barber", "hair", "haircut", "barbershop", "gupit"],
  },
  {
    label: "Auto Shop & Services",
    group: "auto",
    plain: "Vehicle repair or auto services — garage, mechanic, moto shop.",
    examples: ["auto repair", "change oil", "moto shop"],
    aliases: ["auto", "mechanic", "garage", "car repair", "moto", "motorcycle", "change oil"],
  },
  {
    label: "Automotive Parts & Accessories",
    group: "auto",
    plain: "You sell car or moto parts and accessories — not mainly labor.",
    examples: ["tires", "rims", "car accessories"],
    aliases: ["auto parts", "car parts", "tires", "accessories", "mags"],
  },
  {
    label: "Car Wash & Detailing",
    group: "auto",
    plain: "Car wash, detailing, or ceramic coating services.",
    examples: ["car wash", "detailing", "ceramic coat"],
    aliases: ["car wash", "detailing", "wash", "ceramic"],
  },
  {
    label: "Furniture & Home",
    group: "home",
    plain: "Furniture, home decor, or household fixtures.",
    examples: ["sofa", "cabinets", "home decor"],
    aliases: ["furniture", "home decor", "sofa", "cabinet", "interior"],
  },
  {
    label: "HVAC & Air Conditioning",
    group: "home",
    plain: "Aircon sales, cleaning, or installation.",
    examples: ["aircon clean", "split type install"],
    aliases: ["hvac", "aircon", "air con", "air conditioning", "cooling"],
  },
  {
    label: "Construction & Renovation",
    group: "home",
    plain: "Building, remodeling, or contractor services.",
    examples: ["renovation", "contractor", "fit-out"],
    aliases: ["construction", "renovation", "contractor", "builder", "fit out"],
  },
  {
    label: "Home Services & Trades",
    group: "home",
    plain: "Tradespeople — plumber, electrician, carpenter, handyman.",
    examples: ["plumber", "electrician", "handyman"],
    aliases: ["plumber", "electrician", "carpenter", "handyman", "home service", "trades"],
  },
  {
    label: "Landscaping & Gardening",
    group: "home",
    plain: "Gardens, plants, landscaping, or outdoor greenery.",
    examples: ["garden", "plants", "lawn"],
    aliases: ["garden", "landscaping", "plants", "nursery"],
  },
  {
    label: "Solar & Renewable Energy",
    group: "home",
    plain: "Solar panels, inverters, or renewable energy installs.",
    examples: ["solar install", "panels"],
    aliases: ["solar", "renewable", "panels", "inverter"],
  },
  {
    label: "Cleaning & Janitorial",
    group: "home",
    plain: "Cleaning services for homes or offices.",
    examples: ["home cleaning", "office janitorial"],
    aliases: ["cleaning", "janitorial", "housekeeping", "clean"],
  },
  {
    label: "Security & Surveillance",
    group: "home",
    plain: "CCTV, alarms, or security system sales/install.",
    examples: ["CCTV", "alarm system"],
    aliases: ["security", "cctv", "surveillance", "alarm"],
  },
  {
    label: "Healthcare & Clinics",
    group: "health",
    plain: "Clinic, dental, or healthcare services and care packages.",
    examples: ["dental", "clinic", "therapy"],
    aliases: ["healthcare", "clinic", "dental", "doctor", "medical", "therapy"],
  },
  {
    label: "Fitness & Wellness",
    group: "health",
    plain: "Gym, coaching, yoga, or wellness programs.",
    examples: ["gym", "personal trainer", "yoga"],
    aliases: ["fitness", "gym", "wellness", "yoga", "trainer", "workout"],
  },
  {
    label: "Education & Training",
    group: "health",
    plain: "Tutorials, courses, training centers, or learning programs.",
    examples: ["tutorial", "review center", "online course"],
    aliases: ["education", "training", "tutorial", "course", "review center", "school"],
  },
  {
    label: "Childcare & Education",
    group: "health",
    plain: "Daycare, preschool, or kids learning programs.",
    examples: ["daycare", "preschool", "kids class"],
    aliases: ["childcare", "daycare", "preschool", "kids", "nursery school"],
  },
  {
    label: "Insurance & Financial Services",
    group: "services",
    plain: "Insurance, financial advice, or protection plans — not a food or retail shop.",
    examples: ["life insurance", "VUL", "financial advisor", "InLife"],
    aliases: [
      "insurance",
      "life insurance",
      "vul",
      "financial",
      "finance",
      "advisor",
      "agent",
      "protection",
      "policy",
      "insular",
      "inlife",
      "pru life",
      "sun life",
      "investment",
      "mutual fund",
      "banking",
      "loan",
      "lending",
    ],
    popular: true,
  },
  {
    label: "Professional & Consulting",
    group: "services",
    plain: "Consulting, agencies, freelancers, or professional services.",
    examples: ["marketing agency", "accountant", "consultant"],
    aliases: [
      "professional",
      "consulting",
      "consultant",
      "agency",
      "freelance",
      "accountant",
      "lawyer",
      "legal",
      "services",
    ],
    popular: true,
  },
  {
    label: "Printing & Signage",
    group: "services",
    plain: "Print shop — tarpaulin, stickers, cards, signage, lanyards.",
    examples: ["tarpaulin", "calling cards", "stickers"],
    aliases: ["printing", "print", "signage", "tarpaulin", "sticker", "lanyard", "xerox"],
  },
  {
    label: "Photography & Creative",
    group: "services",
    plain: "Photo, video, or creative studio packages.",
    examples: ["studio shoot", "debut package", "content creator"],
    aliases: ["photography", "photo", "studio", "video", "creative", "shoot"],
  },
  {
    label: "Logistics & Shipping",
    group: "services",
    plain: "Delivery, courier, freight, or shipping services.",
    examples: ["courier", "padala", "freight"],
    aliases: ["logistics", "shipping", "courier", "delivery service", "padala", "freight"],
  },
  {
    label: "Real Estate & Property",
    group: "services",
    plain: "Property sales, rentals, or real-estate brokerage.",
    examples: ["condo rental", "house and lot", "broker"],
    aliases: ["real estate", "property", "broker", "condo", "rental", "house and lot"],
  },
  {
    label: "Hotels & Resorts",
    group: "travel",
    plain: "Lodging — hotel, resort, pension, or short-stay rooms.",
    examples: ["resort", "inn", "Airbnb-style rooms"],
    aliases: ["hotel", "resort", "inn", "lodging", "accommodation"],
  },
  {
    label: "Travel & Tours",
    group: "travel",
    plain: "Tours, travel packages, or ticketing.",
    examples: ["island hop", "tour package", "visa assist"],
    aliases: ["travel", "tour", "tours", "ticket", "booking"],
  },
  {
    label: "Camping & Adventures",
    group: "travel",
    plain: "Outdoor adventure gear or guided outdoor activities.",
    examples: ["camping gear", "hike tours"],
    aliases: ["camping", "adventure", "outdoor", "hike", "trek"],
  },
  {
    label: "Events & Entertainment",
    group: "travel",
    plain: "Events, parties, entertainment, or talent bookings.",
    examples: ["event host", "party planner", "DJ"],
    aliases: ["events", "entertainment", "party", "host", "dj", "emcee"],
  },
  {
    label: "Attractions & Leisure",
    group: "travel",
    plain: "Attractions, leisure spots, or ticketed experiences.",
    examples: ["theme park merch", "activity tickets"],
    aliases: ["attractions", "leisure", "theme park", "tickets"],
  },
  {
    label: "Industrial & Manufacturing",
    group: "other",
    plain: "Manufacturing, industrial supplies, or factory goods.",
    examples: ["factory", "industrial parts"],
    aliases: ["industrial", "manufacturing", "factory"],
  },
  {
    label: "General",
    group: "other",
    plain: "Still figuring it out — or your shop spans many things. You can refine later.",
    examples: ["mixed shop", "starting out"],
    aliases: ["general", "other", "mixed", "not sure", "starting"],
  },
];

const GUIDE_BY_LABEL = new Map(SHOP_CATEGORY_GUIDE.map((e) => [e.label, e]));

export function getCategoryGuideEntry(label: string): CategoryGuideEntry | undefined {
  return GUIDE_BY_LABEL.get(label.trim());
}

export function emojiForGuideCategory(label: string): string {
  return SHOP_CATEGORY_EMOJI[label as ShopBusinessCategory] ?? "🛍️";
}

export interface CategoryMatch {
  label: string;
  score: number;
  reason: string;
  entry: CategoryGuideEntry;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Deterministic search — maps how sellers talk → canonical category. */
export function matchBusinessCategories(
  query: string,
  options?: { limit?: number; allowedLabels?: readonly string[] }
): CategoryMatch[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const limit = options?.limit ?? 8;
  const allowed = options?.allowedLabels
    ? new Set(options.allowedLabels.map((l) => l.trim()))
    : null;

  const scored: CategoryMatch[] = [];
  for (const entry of SHOP_CATEGORY_GUIDE) {
    if (allowed && !allowed.has(entry.label)) continue;
    let score = 0;
    let reason = "";

    const labelL = entry.label.toLowerCase();
    if (labelL === q) {
      score = 100;
      reason = "Exact category match";
    } else if (labelL.includes(q) || q.includes(labelL)) {
      score = 70;
      reason = `Matches “${entry.label}”`;
    }

    for (const alias of entry.aliases) {
      const a = alias.toLowerCase();
      if (a === q) {
        score = Math.max(score, 95);
        reason = `People often call this “${alias}”`;
      } else if (q.includes(a) && a.length >= 3) {
        score = Math.max(score, 80 + Math.min(a.length, 10));
        reason = `Matched “${alias}”`;
      } else if (a.includes(q) && q.length >= 3) {
        score = Math.max(score, 55);
        reason = `Related to “${alias}”`;
      }
    }

    for (const ex of entry.examples) {
      if (normalizeQuery(ex).includes(q) || q.includes(normalizeQuery(ex))) {
        score = Math.max(score, 50);
        if (!reason) reason = `Example: ${ex}`;
      }
    }

    if (entry.plain.toLowerCase().includes(q) && q.length >= 4) {
      score = Math.max(score, 40);
      if (!reason) reason = "Matched description";
    }

    if (score > 0) {
      scored.push({ label: entry.label, score, reason: reason || "Related", entry });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return scored.slice(0, limit);
}

export function popularCategoryLabels(allowedLabels?: readonly string[]): string[] {
  const allowed = allowedLabels ? new Set(allowedLabels) : null;
  return SHOP_CATEGORY_GUIDE.filter((e) => e.popular && (!allowed || allowed.has(e.label))).map(
    (e) => e.label
  );
}

export function groupCategoriesForOnboarding(allowedLabels?: readonly string[]): Array<{
  group: CategoryGroup;
  entries: CategoryGuideEntry[];
}> {
  const allowed = allowedLabels
    ? new Set(allowedLabels.map((l) => l.trim()))
    : new Set<string>(SHOP_BUSINESS_CATEGORIES);

  return CATEGORY_GROUPS.map((group) => ({
    group,
    entries: SHOP_CATEGORY_GUIDE.filter(
      (e) => e.group === group.id && allowed.has(e.label)
    ),
  })).filter((g) => g.entries.length > 0);
}

/** Ops / DB categories without a guide entry still show with a safe blurb. */
export function guideEntryOrFallback(label: string): CategoryGuideEntry {
  return (
    getCategoryGuideEntry(label) ?? {
      label,
      group: "other",
      plain: `Shops in the “${label}” category.`,
      examples: [],
      aliases: [label.toLowerCase()],
    }
  );
}

export { DEFAULT_SHOP_BUSINESS_CATEGORY };
