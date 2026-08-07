/**
 * Visual skin for Template Intel stock variants.
 * storeLook knobs alone only affect Sarab today — colors/fonts/radius
 * apply on every live renderer via ResolvedShopTheme.
 */
import { BRAND_PALETTES } from "./brand-kit";
import {
  deriveStoreLook,
  normalizeStoreLook,
  type StoreLook,
} from "./store-look";
import type { ShopDisplayFont } from "./types";

const DISPLAY_FONTS: ShopDisplayFont[] = ["bricolage", "system", "mono-accent"];
const RADII = ["0.375rem", "0.75rem", "1rem", "1.5rem"] as const;

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

/** Full visible skin from stockKey seed (colors + look knobs). */
export function deriveStockSkin(seed: number): StockSkin {
  const look = deriveStoreLook(seed);
  const palette = pick(BRAND_PALETTES, seed, 21);
  return {
    ...look,
    primaryColor: palette.primary,
    accentColor: palette.accent,
    paletteId: palette.id,
    displayFont: pick(DISPLAY_FONTS, seed, 22),
    radius: pick(RADII, seed, 23),
  };
}

/**
 * Merge stored JSON with a deterministic fallback from stockKey so older
 * drafts (look-knobs only) still get distinct colors in preview/Launch.
 */
export function resolveStockSkin(
  stored: StockSkinJson | null | undefined,
  stockKey: string
): StockSkin {
  const seed = hashStockKey(stockKey);
  const derived = deriveStockSkin(seed);
  const look = normalizeStoreLook(stored);
  const font = stored?.displayFont;
  return {
    ...look,
    primaryColor: stored?.primaryColor || derived.primaryColor,
    accentColor: stored?.accentColor || derived.accentColor,
    paletteId: stored?.paletteId || derived.paletteId,
    displayFont:
      font === "bricolage" || font === "system" || font === "mono-accent"
        ? font
        : derived.displayFont,
    radius: stored?.radius || derived.radius,
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
