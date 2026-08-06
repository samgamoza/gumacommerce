/**
 * Deterministic within-template look knobs.
 * Same template (e.g. Sarab) can still feel different shop-to-shop — zero LLM.
 */

export const STORE_HERO_LAYOUTS = ["circle", "split", "stack"] as const;
export const STORE_MARQUEE_MODES = ["on", "off"] as const;
export const STORE_FLOAT_CARD_MODES = ["on", "off"] as const;
export const STORE_MENU_COLUMNS = ["2", "3"] as const;
export const STORE_TYPE_SCALES = ["classic", "bold", "soft"] as const;
export const STORE_RADIUS_TONES = ["soft", "sharp"] as const;

export type StoreHeroLayout = (typeof STORE_HERO_LAYOUTS)[number];
export type StoreMarqueeMode = (typeof STORE_MARQUEE_MODES)[number];
export type StoreFloatCardMode = (typeof STORE_FLOAT_CARD_MODES)[number];
export type StoreMenuColumns = (typeof STORE_MENU_COLUMNS)[number];
export type StoreTypeScale = (typeof STORE_TYPE_SCALES)[number];
export type StoreRadiusTone = (typeof STORE_RADIUS_TONES)[number];

export interface StoreLook {
  heroLayout: StoreHeroLayout;
  marquee: StoreMarqueeMode;
  floatCards: StoreFloatCardMode;
  menuColumns: StoreMenuColumns;
  typeScale: StoreTypeScale;
  radiusTone: StoreRadiusTone;
}

export const DEFAULT_STORE_LOOK: StoreLook = {
  heroLayout: "circle",
  marquee: "on",
  floatCards: "on",
  menuColumns: "3",
  typeScale: "classic",
  radiusTone: "soft",
};

/** Combinatorial space from look knobs alone (before palette / promo / template). */
export const STORE_LOOK_COMBINATIONS =
  STORE_HERO_LAYOUTS.length *
  STORE_MARQUEE_MODES.length *
  STORE_FLOAT_CARD_MODES.length *
  STORE_MENU_COLUMNS.length *
  STORE_TYPE_SCALES.length *
  STORE_RADIUS_TONES.length;

function pick<T extends string>(items: readonly T[], seed: number, salt: number): T {
  return items[(seed + salt * 2654435761) % items.length] as T;
}

/** Stable look derived from signup seed (slug + name hash). */
export function deriveStoreLook(seed: number): StoreLook {
  return {
    heroLayout: pick(STORE_HERO_LAYOUTS, seed, 11),
    marquee: pick(STORE_MARQUEE_MODES, seed, 12),
    // Prefer floats on for most shops; only ~1/3 hide them.
    floatCards: (seed + 13 * 2654435761) % 3 === 0 ? "off" : "on",
    menuColumns: pick(STORE_MENU_COLUMNS, seed, 14),
    typeScale: pick(STORE_TYPE_SCALES, seed, 15),
    radiusTone: pick(STORE_RADIUS_TONES, seed, 16),
  };
}

export function normalizeStoreLook(
  partial: Partial<StoreLook> | null | undefined
): StoreLook {
  if (!partial) return { ...DEFAULT_STORE_LOOK };
  return {
    heroLayout: STORE_HERO_LAYOUTS.includes(partial.heroLayout as StoreHeroLayout)
      ? (partial.heroLayout as StoreHeroLayout)
      : DEFAULT_STORE_LOOK.heroLayout,
    marquee: STORE_MARQUEE_MODES.includes(partial.marquee as StoreMarqueeMode)
      ? (partial.marquee as StoreMarqueeMode)
      : DEFAULT_STORE_LOOK.marquee,
    floatCards: STORE_FLOAT_CARD_MODES.includes(partial.floatCards as StoreFloatCardMode)
      ? (partial.floatCards as StoreFloatCardMode)
      : DEFAULT_STORE_LOOK.floatCards,
    menuColumns: STORE_MENU_COLUMNS.includes(partial.menuColumns as StoreMenuColumns)
      ? (partial.menuColumns as StoreMenuColumns)
      : DEFAULT_STORE_LOOK.menuColumns,
    typeScale: STORE_TYPE_SCALES.includes(partial.typeScale as StoreTypeScale)
      ? (partial.typeScale as StoreTypeScale)
      : DEFAULT_STORE_LOOK.typeScale,
    radiusTone: STORE_RADIUS_TONES.includes(partial.radiusTone as StoreRadiusTone)
      ? (partial.radiusTone as StoreRadiusTone)
      : DEFAULT_STORE_LOOK.radiusTone,
  };
}
