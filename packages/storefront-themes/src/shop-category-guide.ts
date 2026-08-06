/**
 * Onboarding category guide — plain language, aliases, groups.
 * Sellers search how they talk; we map to canonical ShopBusinessCategory labels.
 */
import {
  DEFAULT_SHOP_BUSINESS_CATEGORY,
  SHOP_BUSINESS_CATEGORIES,
  SHOP_CATEGORY_EMOJI,
  emojiForShopCategory,
  type ShopBusinessCategory,
} from "./shop-categories";

export type CategoryGroupId =
  | "food"
  | "retail"
  | "fashion"
  | "beauty"
  | "auto"
  | "ondemand"
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
  { id: "ondemand", label: "On-demand services", blurb: "Repairs, home care, lawn, pest, weddings — bookable services" },
  { id: "auto", label: "Auto & wheels", blurb: "Mechanic, parts, wash, body paint, moto" },
  { id: "home", label: "Home goods & build", blurb: "Furniture, construction, solar, security products" },
  { id: "health", label: "Health & learn", blurb: "Clinics, fitness, schools, childcare" },
  { id: "services", label: "Pro services", blurb: "Insurance, consulting, print, photo, logistics" },
  { id: "travel", label: "Travel & leisure", blurb: "Hotels, tours, attractions, entertainment" },
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
    label: "Appliance & Device Repair",
    group: "ondemand",
    plain:
      "On-demand repairs for appliances and gadgets — washing machine, fridge, cellphone, laptop, and more.",
    examples: ["cellphone repair", "washing machine", "fridge tech", "laptop fix"],
    aliases: [
      "appliance repair",
      "device repair",
      "cellphone repair",
      "cellphone",
      "cell phone",
      "phone repair",
      "mobile repair",
      "washing machine",
      "washer",
      "dryer",
      "refrigerator",
      "fridge",
      "appliance",
      "gadget repair",
      "laptop repair",
      "on demand repair",
      "on-demand repair",
      "home appliance",
      "repair service",
    ],
    popular: true,
  },
  {
    label: "HVAC & Air Conditioning",
    group: "ondemand",
    plain: "Aircon cleaning, repair, or installation — split type, window, or central.",
    examples: ["aircon clean", "split type install", "aircon repair"],
    aliases: [
      "hvac",
      "aircon",
      "air con",
      "air conditioning",
      "aircon repair",
      "aircon clean",
      "cooling",
      "ac repair",
    ],
    popular: true,
  },
  {
    label: "Home Services & Trades",
    group: "ondemand",
    plain: "Tradespeople on call — plumber, electrician, carpenter, handyman.",
    examples: ["plumber", "electrician", "handyman"],
    aliases: [
      "plumber",
      "electrician",
      "carpenter",
      "handyman",
      "home service",
      "home services",
      "trades",
      "on demand service",
      "ondemand",
    ],
    popular: true,
  },
  {
    label: "House Painting & Decorating",
    group: "ondemand",
    plain: "Interior or exterior house painting, touch-ups, and decorative finishes.",
    examples: ["house paint", "repaint rooms", "exterior paint"],
    aliases: [
      "house painting",
      "house paint",
      "painting",
      "painter",
      "repaint",
      "interior paint",
      "exterior paint",
      "wall paint",
      "decorating",
    ],
    popular: true,
  },
  {
    label: "Pest Control",
    group: "ondemand",
    plain: "Termite, cockroach, mosquito, or general pest treatment for homes and offices.",
    examples: ["termite treatment", "fogging", "cockroach"],
    aliases: [
      "pest control",
      "pest",
      "termite",
      "cockroach",
      "mosquito",
      "fogging",
      "exterminator",
      "ipis",
      "bukbok",
    ],
    popular: true,
  },
  {
    label: "Cleaning & Janitorial",
    group: "ondemand",
    plain: "Home or office cleaning — deep clean, move-out, or recurring janitorial.",
    examples: ["home cleaning", "office janitorial", "deep clean"],
    aliases: ["cleaning", "janitorial", "housekeeping", "deep clean", "home clean", "clean"],
  },
  {
    label: "Landscaping & Gardening",
    group: "ondemand",
    plain: "Lawn care, garden improvements, plants, or outdoor landscaping.",
    examples: ["lawn mowing", "garden makeover", "plant nursery"],
    aliases: [
      "garden",
      "gardening",
      "landscaping",
      "landscape",
      "lawn",
      "lawn care",
      "lawn mowing",
      "garden improvements",
      "plants",
      "nursery",
      "grass cutting",
    ],
  },
  {
    label: "Wedding Planning & Events",
    group: "ondemand",
    plain: "Wedding coordination, debut/party planning, or full event packages.",
    examples: ["wedding planner", "debut package", "church + reception"],
    aliases: [
      "wedding",
      "wedding planner",
      "wedding planning",
      "kasal",
      "debut",
      "event planner",
      "bridal",
      "reception",
    ],
    popular: true,
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
    aliases: ["car wash", "detailing", "auto detail", "wash", "ceramic", "carwash"],
    popular: true,
  },
  {
    label: "Auto Body & Painting",
    group: "auto",
    plain: "Body repair, dent removal, or full car painting / repaint jobs.",
    examples: ["car paint", "body repair", "dent removal"],
    aliases: [
      "car painting",
      "car paint",
      "auto body",
      "body shop",
      "repaint car",
      "dent",
      "collision",
      "bumper repair",
    ],
  },
  {
    label: "Furniture & Home",
    group: "home",
    plain: "Furniture, home decor, or household fixtures.",
    examples: ["sofa", "cabinets", "home decor"],
    aliases: ["furniture", "home decor", "sofa", "cabinet", "interior"],
  },
  {
    label: "Construction & Renovation",
    group: "home",
    plain: "Building, remodeling, or contractor services.",
    examples: ["renovation", "contractor", "fit-out"],
    aliases: ["construction", "renovation", "contractor", "builder", "fit out"],
  },
  {
    label: "Solar & Renewable Energy",
    group: "home",
    plain: "Solar panels, inverters, or renewable energy installs.",
    examples: ["solar install", "panels"],
    aliases: ["solar", "renewable", "panels", "inverter"],
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
      "professional services",
      "business consulting",
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
    plain: "Parties, entertainment, DJ, host, or talent bookings (not full wedding planning).",
    examples: ["event host", "party planner", "DJ"],
    aliases: ["events", "entertainment", "party", "host", "dj", "emcee", "talent booking"],
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
  return (
    SHOP_CATEGORY_EMOJI[label as ShopBusinessCategory] ??
    emojiForShopCategory(label)
  );
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

/** Noise words that rarely identify a vertical on their own. */
const CUE_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "of",
  "to",
  "in",
  "on",
  "at",
  "my",
  "our",
  "we",
  "i",
  "im",
  "i'm",
  "is",
  "are",
  "be",
  "do",
  "does",
  "doing",
  "with",
  "from",
  "your",
  "you",
  "shop",
  "store",
  "business",
  "online",
  "selling",
  "sell",
  "sells",
  "sale",
  "sales",
  "ph",
  "philippines",
  "manila",
  "qc",
  "city",
  "metro",
  "inc",
  "co",
  "company",
  "ltd",
  "the",
  "best",
  "new",
  "near",
  "me",
]);

function tokenizeCue(text: string): string[] {
  return normalizeQuery(text)
    .replace(/[^a-z0-9\s&]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !CUE_STOPWORDS.has(t));
}

function scoreEntryAgainstCue(
  entry: CategoryGuideEntry,
  cue: string
): { score: number; reason: string } {
  const q = normalizeQuery(cue);
  if (!q) return { score: 0, reason: "" };

  let score = 0;
  let reason = "";

  const labelL = entry.label.toLowerCase();
  if (labelL === q) {
    score = 100;
    reason = "Exact category match";
  } else if (labelL.includes(q) || (q.length >= 4 && q.includes(labelL))) {
    score = 72;
    reason = `Matches “${entry.label}”`;
  }

  for (const alias of entry.aliases) {
    const a = alias.toLowerCase();
    if (a === q) {
      score = Math.max(score, 96);
      reason = `People often call this “${alias}”`;
    } else if (q.includes(a) && a.length >= 3) {
      const phraseBoost = a.includes(" ") ? 8 : 0;
      score = Math.max(score, 82 + Math.min(a.length, 12) + phraseBoost);
      reason = `Matched “${alias}”`;
    } else if (a.includes(q) && q.length >= 3) {
      score = Math.max(score, 56);
      reason = `Related to “${alias}”`;
    }
  }

  for (const ex of entry.examples) {
    const exN = normalizeQuery(ex);
    if (exN.includes(q) || q.includes(exN)) {
      score = Math.max(score, 52);
      if (!reason) reason = `Example: ${ex}`;
    }
  }

  if (entry.plain.toLowerCase().includes(q) && q.length >= 4) {
    score = Math.max(score, 42);
    if (!reason) reason = "Matched description";
  }

  // Token predictive pass — shop names / sentences like "QC Aircon Repair Pros"
  const tokens = tokenizeCue(q);
  if (tokens.length > 0) {
    let tokenHits = 0;
    let bestTokenReason = "";
    for (const token of tokens) {
      let hit = false;
      if (labelL.split(/[^a-z0-9]+/).includes(token)) {
        hit = true;
        score = Math.max(score, 48 + token.length);
        bestTokenReason = `Heard “${token}” in ${entry.label}`;
      }
      for (const alias of entry.aliases) {
        const a = alias.toLowerCase();
        const aliasTokens = tokenizeCue(a);
        if (a === token || aliasTokens.includes(token)) {
          hit = true;
          const boost = a === token || aliasTokens.length === 1 ? 64 : 58;
          score = Math.max(score, boost + Math.min(token.length, 8));
          bestTokenReason = `Cue matched “${alias}”`;
        }
      }
      for (const ex of entry.examples) {
        if (tokenizeCue(ex).includes(token)) {
          hit = true;
          score = Math.max(score, 46);
          if (!bestTokenReason) bestTokenReason = `Close to “${ex}”`;
        }
      }
      if (hit) tokenHits += 1;
    }
    if (tokenHits >= 2) {
      score = Math.min(100, score + 12 * (tokenHits - 1));
      reason = reason || bestTokenReason || "Multiple cues matched";
    } else if (tokenHits === 1 && !reason) {
      reason = bestTokenReason;
    } else if (bestTokenReason && score >= 46) {
      reason = reason || bestTokenReason;
    }
  }

  return { score, reason: reason || "Related" };
}

/** Deterministic search — maps how sellers talk → canonical category. */
export function matchBusinessCategories(
  query: string,
  options?: { limit?: number; allowedLabels?: readonly string[]; minScore?: number }
): CategoryMatch[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const limit = options?.limit ?? 8;
  const minScore = options?.minScore ?? 1;
  const allowed = options?.allowedLabels
    ? new Set(options.allowedLabels.map((l) => l.trim()))
    : null;

  const scored: CategoryMatch[] = [];
  for (const entry of SHOP_CATEGORY_GUIDE) {
    if (allowed && !allowed.has(entry.label)) continue;
    const { score, reason } = scoreEntryAgainstCue(entry, q);
    if (score >= minScore) {
      scored.push({ label: entry.label, score, reason, entry });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return scored.slice(0, limit);
}

export interface CategoryPredictCues {
  /** Free-text description: “aircon repair in QC”, “life insurance advisor” */
  text?: string | null;
  shopName?: string | null;
  shopSlug?: string | null;
}

/**
 * Predictive vertical ranking from onboarding cues.
 * Returns only high-confidence matches — never the full catalog.
 * Deterministic (Launch-safe, zero LLM).
 */
export function predictBusinessCategories(
  cues: CategoryPredictCues,
  options?: {
    allowedLabels?: readonly string[];
    limit?: number;
    minScore?: number;
    group?: CategoryGroupId;
  }
): CategoryMatch[] {
  const parts = [
    cues.text?.trim(),
    cues.shopName?.trim(),
    cues.shopSlug?.trim().replace(/[-_]+/g, " "),
  ].filter((p): p is string => Boolean(p && p.length > 0));

  if (parts.length === 0) return [];

  // Weight explicit seller text highest, then shop name, then slug.
  const blended = new Map<string, CategoryMatch>();
  const weighted: Array<{ cue: string; weight: number }> = [];
  if (cues.text?.trim()) weighted.push({ cue: cues.text, weight: 1 });
  if (cues.shopName?.trim()) weighted.push({ cue: cues.shopName, weight: 0.85 });
  if (cues.shopSlug?.trim()) {
    weighted.push({ cue: cues.shopSlug.replace(/[-_]+/g, " "), weight: 0.55 });
  }

  for (const { cue, weight } of weighted) {
    const hits = matchBusinessCategories(cue, {
      allowedLabels: options?.allowedLabels,
      limit: 12,
      minScore: 40,
    });
    for (const hit of hits) {
      if (options?.group && hit.entry.group !== options.group) continue;
      const adjusted = Math.round(hit.score * weight);
      const prev = blended.get(hit.label);
      if (!prev || adjusted > prev.score) {
        blended.set(hit.label, { ...hit, score: adjusted });
      }
    }
  }

  const minScore = options?.minScore ?? 48;
  const limit = options?.limit ?? 5;
  let ranked = [...blended.values()]
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  if (ranked.length === 0) return [];

  // Relative cutoff: only keep verticals close to the top cue match.
  const top = ranked[0]!.score;
  const floor = Math.max(minScore, Math.floor(top * 0.62));
  ranked = ranked.filter((m) => m.score >= floor).slice(0, limit);
  return ranked;
}

/** Sparse fallback: pick a group, then predict within it (still not a full dump). */
export function predictCategoriesForGroup(
  groupId: CategoryGroupId,
  cues: CategoryPredictCues,
  options?: { allowedLabels?: readonly string[]; limit?: number }
): CategoryMatch[] {
  const fromCues = predictBusinessCategories(cues, {
    ...options,
    group: groupId,
    limit: options?.limit ?? 5,
    minScore: 40,
  });
  if (fromCues.length > 0) return fromCues;

  // No cue signal inside the group — show a short curated shortlist (popular first).
  const allowed = options?.allowedLabels
    ? new Set(options.allowedLabels.map((l) => l.trim()))
    : null;
  const entries = SHOP_CATEGORY_GUIDE.filter(
    (e) => e.group === groupId && (!allowed || allowed.has(e.label))
  ).sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)));

  return entries.slice(0, options?.limit ?? 5).map((entry, index) => ({
    label: entry.label,
    score: 40 - index,
    reason: "Top picks in this area",
    entry,
  }));
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
