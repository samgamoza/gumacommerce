/**
 * Visual skin for Template Intel stock variants.
 * Sequential Looks (v01/v02/n01…) must be obviously different — not two teals.
 */
import { BRAND_PALETTES, type BrandPalette } from "./brand-kit";
import {
  deriveStoreLook,
  normalizeStoreLook,
  type StoreLook,
} from "./store-look";
import type { ShopDisplayFont } from "./types";

const DISPLAY_FONTS: ShopDisplayFont[] = ["bricolage", "system", "mono-accent"];
const RADII = ["0.375rem", "0.85rem", "1.35rem", "0.15rem"] as const;

/**
 * High-contrast palette ladder for ops stock Looks.
 * Ordered so adjacent indices (Look 1 vs 2) never share a similar hue family.
 */
const STOCK_VISIBLE_PALETTES: BrandPalette[] = [
  BRAND_PALETTES.find((p) => p.id === "manila-sunset")!,
  BRAND_PALETTES.find((p) => p.id === "midnight-neon")!,
  BRAND_PALETTES.find((p) => p.id === "dragonfruit")!,
  BRAND_PALETTES.find((p) => p.id === "island-blue")!,
  BRAND_PALETTES.find((p) => p.id === "ube-cream")!,
  BRAND_PALETTES.find((p) => p.id === "coral-reef")!,
  BRAND_PALETTES.find((p) => p.id === "mango-royale")!,
  BRAND_PALETTES.find((p) => p.id === "cyber-grape")!,
  BRAND_PALETTES.find((p) => p.id === "espresso")!,
  BRAND_PALETTES.find((p) => p.id === "electric-lime")!,
  BRAND_PALETTES.find((p) => p.id === "bubblegum")!,
  BRAND_PALETTES.find((p) => p.id === "taho-caramel")!,
].filter(Boolean);

export type StockSkinJson = Partial<StoreLook> & {
  primaryColor?: string;
  accentColor?: string;
  displayFont?: ShopDisplayFont;
  radius?: string;
  paletteId?: string;
};

export type StockSkin = StoreLook & {
  primaryColor: string;
  accentColor: string;
  displayFont: ShopDisplayFont;
  radius: string;
  paletteId: string;
};

function pick<T>(items: readonly T[], seed: number, salt: number): T {
  return items[(seed + salt * 2654435761) % items.length] as T;
}

/** Look 1 → 0, Look 2 → 1 from keys like …-v01, …-n02, …-look-3 */
export function lookIndexFromStockKey(stockKey: string): number | null {
  const m =
    stockKey.match(/(?:^|[-_])(?:v|n|look)[-_]?(\d+)$/i) ??
    stockKey.match(/[-_](\d{1,2})$/);
  if (!m) return null;
  return Math.max(0, Number.parseInt(m[1]!, 10) - 1);
}

function paletteForStock(seed: number, stockKey: string): BrandPalette {
  const pool = STOCK_VISIBLE_PALETTES.length > 0 ? STOCK_VISIBLE_PALETTES : BRAND_PALETTES;
  const lookIdx = lookIndexFromStockKey(stockKey);
  if (lookIdx != null) {
    return pool[lookIdx % pool.length]!;
  }
  return pick(pool, seed, 21);
}

/** Full visible skin from stockKey (colors + look knobs). */
export function deriveStockSkin(seed: number, stockKey = ""): StockSkin {
  const look = deriveStoreLook(seed);
  const palette = paletteForStock(seed, stockKey || `seed-${seed}`);
  const lookIdx = lookIndexFromStockKey(stockKey);
  const font =
    lookIdx != null
      ? DISPLAY_FONTS[lookIdx % DISPLAY_FONTS.length]!
      : pick(DISPLAY_FONTS, seed, 22);
  const radius =
    lookIdx != null ? RADII[lookIdx % RADII.length]! : pick(RADII, seed, 23);
  return {
    ...look,
    primaryColor: palette.primary,
    accentColor: palette.accent,
    paletteId: palette.id,
    displayFont: font,
    radius,
  };
}

/**
 * Resolve skin for preview/Launch.
 * Seeded Look keys (…-v01 / …-n02) use the high-contrast ladder so older drafts
 * with near-identical teals still preview as distinct.
 * AI-curated keys (…-ai-01) prefer stored palette/font/radius from the curator.
 */
export function resolveStockSkin(
  stored: StockSkinJson | null | undefined,
  stockKey: string
): StockSkin {
  const seed = hashStockKey(stockKey);
  const derived = deriveStockSkin(seed, stockKey);
  const look = normalizeStoreLook(stored);
  const aiCurated =
    /(?:^|[-_])ai[-_]?\d+/i.test(stockKey) &&
    Boolean(stored?.primaryColor && stored?.accentColor);

  if (aiCurated && stored) {
    const fontOk =
      stored.displayFont &&
      (DISPLAY_FONTS as readonly string[]).includes(stored.displayFont);
    return {
      ...look,
      primaryColor: stored.primaryColor!,
      accentColor: stored.accentColor!,
      paletteId: stored.paletteId ?? derived.paletteId,
      displayFont: (fontOk ? stored.displayFont : derived.displayFont) as StockSkin["displayFont"],
      radius: stored.radius ?? derived.radius,
    };
  }

  return {
    ...look,
    primaryColor: derived.primaryColor,
    accentColor: derived.accentColor,
    paletteId: derived.paletteId,
    displayFont: derived.displayFont,
    radius: derived.radius,
  };
}

export function hashStockKey(stockKey: string): number {
  let hash = 0x811c9dc5;
  const value = `stock::${stockKey}`;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Ops seed used to name skins "Haircut Look 1" — hide that from sellers. */
export function isGenericLookNumberLabel(label: string | null | undefined): boolean {
  return /\b(?:AI\s+)?Look\s*\d+\s*$/i.test((label ?? "").trim());
}

function paletteLabelForId(paletteId: string | undefined): string | null {
  if (!paletteId) return null;
  const fromVisible = STOCK_VISIBLE_PALETTES.find((p) => p.id === paletteId);
  if (fromVisible) return fromVisible.label;
  return BRAND_PALETTES.find((p) => p.id === paletteId)?.label ?? null;
}

/**
 * Seller-facing skin name from stock key / palette (never "Look 1").
 * Example: "Manila Sunset Soft", "Midnight Neon Bold".
 */
export function sellerLabelForStockKey(
  stockKey: string,
  options?: { paletteId?: string | null; storeLook?: StockSkinJson | null }
): string {
  const skin = resolveStockSkin(options?.storeLook, stockKey);
  const paletteId = options?.paletteId || skin.paletteId;
  const base =
    paletteLabelForId(paletteId) ??
    paletteLabelForId(skin.paletteId) ??
    "Shop Skin";
  const mood =
    skin.typeScale === "bold"
      ? "Bold"
      : skin.typeScale === "soft"
        ? "Soft"
        : skin.heroLayout === "split"
          ? "Split"
          : skin.heroLayout === "stack"
            ? "Stack"
            : "";
  return mood ? `${base} ${mood}` : base;
}

/** Prefer a human label; rewrite generic "… Look N" names. */
export function sellerFacingStockLabel(input: {
  label: string;
  stockKey: string;
  storeLookJson?: StockSkinJson | null;
}): string {
  if (!isGenericLookNumberLabel(input.label)) return input.label.trim();
  return sellerLabelForStockKey(input.stockKey, {
    storeLook: input.storeLookJson,
    paletteId: input.storeLookJson?.paletteId,
  });
}
