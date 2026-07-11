import { getShopTemplate } from "./templates";
import type {
  StorePatternDefinition,
  StorePatternId,
  TenantThemeJson,
} from "./types";

export const STORE_PATTERNS: StorePatternDefinition[] = [
  {
    id: "classic",
    label: "Classic Guma",
    description: "Default mobile-first catalog with the standard seller dashboard.",
    tags: ["default", "general"],
    categoryHints: [],
    templateId: "clean-guma",
    storefrontRenderer: "themed",
    dashboardRenderer: "guma",
  },
  {
    id: "simply-sweet",
    label: "Simply Sweet",
    description:
      "Home-bakery storefront with neon accents, vlog hero, and a dark tabbed creator dashboard — ported from the Simply Sweet Creations reference store.",
    tags: ["bakery", "pastry", "vlog", "home baking", "creator", "sweets", "recipes"],
    categoryHints: [
      /bakery|pastry|cake|dessert|sweet|baking/i,
      /home.?baker|home.?kitchen|homemade/i,
      /vlog|creator|content.?creator/i,
      /recipe|delicacy|confection/i,
    ],
    templateId: "simply-sweet",
    storefrontRenderer: "sweet-kitchen",
    dashboardRenderer: "sweet-kitchen",
  },
];

export const STORE_PATTERN_MAP = Object.fromEntries(
  STORE_PATTERNS.map((pattern) => [pattern.id, pattern])
) as Record<StorePatternId, StorePatternDefinition>;

const CUTE_PALETTE_IDS = ["bubblegum", "halo-halo", "dragonfruit", "taho-caramel", "coral-reef"];

/** Structural toggles available within the Simply Sweet pattern. */
export const SIMPLY_SWEET_HERO_STYLES = ["photo-overlay", "soft-gradient"] as const;
export const SIMPLY_SWEET_SECTION_FLAGS = [
  "vlogTeaser",
  "socialProof",
  "aboutStrip",
  "featuredRow",
] as const;
export const SIMPLY_SWEET_PROMO_VARIANTS = 8;
export const SIMPLY_SWEET_TAGLINE_VARIANTS = 6;

/**
 * Deterministic unique identities the Simply Sweet pattern can produce before
 * free-form color/logo/cover overrides:
 *
 *   2 hero styles
 * × 2⁴ section visibility combos (vlog / social proof / about / featured)
 * × 5 cute palettes
 * × 8 promo lines
 * × 6 tagline patterns
 * = 7,680 paired storefront + dashboard looks
 *
 * Growth/Pro unlocks extra sections (live selling, deals) which doubles section
 * combos → up to 15,360. Custom primary/accent colors and uploaded media make
 * the space effectively unbounded for production shops.
 */
export const SIMPLY_SWEET_VARIATION_COUNT = {
  heroStyles: SIMPLY_SWEET_HERO_STYLES.length,
  sectionCombos: 2 ** SIMPLY_SWEET_SECTION_FLAGS.length,
  palettes: CUTE_PALETTE_IDS.length,
  promoVariants: SIMPLY_SWEET_PROMO_VARIANTS,
  taglineVariants: SIMPLY_SWEET_TAGLINE_VARIANTS,
  deterministicTotal:
    SIMPLY_SWEET_HERO_STYLES.length *
    2 ** SIMPLY_SWEET_SECTION_FLAGS.length *
    CUTE_PALETTE_IDS.length *
    SIMPLY_SWEET_PROMO_VARIANTS *
    SIMPLY_SWEET_TAGLINE_VARIANTS,
  withPremiumSections:
    SIMPLY_SWEET_HERO_STYLES.length *
    2 ** (SIMPLY_SWEET_SECTION_FLAGS.length + 2) *
    CUTE_PALETTE_IDS.length *
    SIMPLY_SWEET_PROMO_VARIANTS *
    SIMPLY_SWEET_TAGLINE_VARIANTS,
};

export function isStorePatternId(value: string): value is StorePatternId {
  return value in STORE_PATTERN_MAP;
}

export function getStorePattern(id: StorePatternId): StorePatternDefinition {
  return STORE_PATTERN_MAP[id];
}

export function matchStorePattern(input: {
  category?: string | null;
  vibe?: string | null;
  templateId?: string | null;
}): StorePatternId {
  const templateId = input.templateId?.trim();
  if (templateId === "simply-sweet") return "simply-sweet";

  const category = input.category?.trim() ?? "";
  if (category) {
    const sweet = STORE_PATTERNS.find(
      (pattern) =>
        pattern.id === "simply-sweet" &&
        pattern.categoryHints.some((hint) => hint.test(category))
    );
    if (sweet) return "simply-sweet";
  }

  if (input.vibe === "cute" && /bakery|pastry|sweet|baking|dessert/i.test(category)) {
    return "simply-sweet";
  }

  return "classic";
}

export function resolveStorePattern(themeJson: TenantThemeJson | null | undefined): StorePatternId {
  const stored = themeJson?.patternId?.trim();
  if (stored && isStorePatternId(stored)) return stored;

  return matchStorePattern({
    category: null,
    vibe: themeJson?.vibe,
    templateId: themeJson?.templateId,
  });
}

export function resolvePatternThemeDefaults(patternId: StorePatternId): TenantThemeJson {
  const pattern = getStorePattern(patternId);
  const template = getShopTemplate(pattern.templateId);

  return {
    patternId,
    templateId: pattern.templateId,
    primaryColor: template.tokens.primary,
    accentColor: template.tokens.accent,
    vibe: patternId === "simply-sweet" ? "cute" : undefined,
  };
}
