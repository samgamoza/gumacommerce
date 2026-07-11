import { SHOP_TEMPLATES } from "./templates";
import { canUseTemplate } from "./resolve-theme";
import { matchStorePattern } from "./patterns";
import type { ShopTemplateId, TenantThemeJson } from "./types";

/**
 * Zero-cost brand differentiation engine.
 *
 * Every new shop gets a unique-feeling starting identity derived
 * deterministically from its name + slug + chosen vibe — no LLM call, no
 * randomness that changes between renders, and no two friends landing on the
 * same default green storefront.
 */

export type ShopVibeId = "fresh" | "minimal" | "cute" | "bold" | "premium" | "electric";

export interface ShopVibe {
  id: ShopVibeId;
  emoji: string;
  label: string;
  description: string;
  /** Ordered template preference; first one the plan allows wins. */
  templates: ShopTemplateId[];
  /** Indices into BRAND_PALETTES this vibe draws from. */
  paletteIds: string[];
}

export interface BrandPalette {
  id: string;
  label: string;
  primary: string;
  accent: string;
}

/** Curated primary/accent duos — every pair passes contrast checks on light and dark templates. */
export const BRAND_PALETTES: BrandPalette[] = [
  { id: "guma-green", label: "Guma Green", primary: "#059669", accent: "#f59e0b" },
  { id: "manila-sunset", label: "Manila Sunset", primary: "#ea580c", accent: "#fbbf24" },
  { id: "ube-cream", label: "Ube Cream", primary: "#7c3aed", accent: "#fb923c" },
  { id: "sampaguita", label: "Sampaguita", primary: "#0f766e", accent: "#fde047" },
  { id: "dragonfruit", label: "Dragonfruit", primary: "#db2777", accent: "#4ade80" },
  { id: "halo-halo", label: "Halo-Halo", primary: "#9333ea", accent: "#f472b6" },
  { id: "island-blue", label: "Island Blue", primary: "#0284c7", accent: "#fb7185" },
  { id: "mango-royale", label: "Mango Royale", primary: "#d97706", accent: "#84cc16" },
  { id: "midnight-neon", label: "Midnight Neon", primary: "#6366f1", accent: "#22d3ee" },
  { id: "calamansi", label: "Calamansi", primary: "#65a30d", accent: "#facc15" },
  { id: "taho-caramel", label: "Taho Caramel", primary: "#b45309", accent: "#fcd34d" },
  { id: "coral-reef", label: "Coral Reef", primary: "#e11d48", accent: "#2dd4bf" },
  { id: "ink-slate", label: "Ink & Slate", primary: "#1e293b", accent: "#94a3b8" },
  { id: "espresso", label: "Espresso", primary: "#44403c", accent: "#d6d3d1" },
  { id: "orchid-noir", label: "Orchid Noir", primary: "#a21caf", accent: "#e879f9" },
  { id: "electric-lime", label: "Electric Lime", primary: "#16a34a", accent: "#a3e635" },
  { id: "bubblegum", label: "Bubblegum", primary: "#ec4899", accent: "#93c5fd" },
  { id: "cyber-grape", label: "Cyber Grape", primary: "#8b5cf6", accent: "#5eead4" },
];

export const SHOP_VIBES: ShopVibe[] = [
  {
    id: "fresh",
    emoji: "🌿",
    label: "Fresh & friendly",
    description: "Clean, trustworthy, everyday shopping",
    templates: ["clean-guma", "blush-bakery", "mono-market"],
    paletteIds: ["guma-green", "sampaguita", "calamansi", "island-blue", "electric-lime"],
  },
  {
    id: "minimal",
    emoji: "◻️",
    label: "Minimal & sharp",
    description: "High contrast, zero clutter, premium type",
    templates: ["mono-market", "magazine-rack", "clean-guma"],
    paletteIds: ["ink-slate", "espresso", "guma-green", "island-blue"],
  },
  {
    id: "cute",
    emoji: "🧁",
    label: "Cute & cozy",
    description: "Soft pastels and IG-worthy warmth",
    templates: ["simply-sweet", "blush-bakery", "clean-guma", "y2k-chrome"],
    paletteIds: ["bubblegum", "halo-halo", "dragonfruit", "taho-caramel", "coral-reef"],
  },
  {
    id: "bold",
    emoji: "🔥",
    label: "Bold & loud",
    description: "Street-market energy with big CTAs",
    templates: ["street-cart", "clean-guma", "neon-bazaar"],
    paletteIds: ["manila-sunset", "mango-royale", "coral-reef", "calamansi", "dragonfruit"],
  },
  {
    id: "premium",
    emoji: "✨",
    label: "Premium & sleek",
    description: "Editorial layouts for curated brands",
    templates: ["magazine-rack", "glass-future", "mono-market"],
    paletteIds: ["ube-cream", "orchid-noir", "ink-slate", "espresso", "cyber-grape"],
  },
  {
    id: "electric",
    emoji: "⚡",
    label: "Electric & hype",
    description: "Dark mode, neon accents, TikTok-era",
    templates: ["neon-bazaar", "holo-grid", "mono-market"],
    paletteIds: ["midnight-neon", "cyber-grape", "electric-lime", "orchid-noir", "halo-halo"],
  },
];

const VIBE_MAP = Object.fromEntries(SHOP_VIBES.map((v) => [v.id, v])) as Record<
  ShopVibeId,
  ShopVibe
>;

export function isShopVibeId(value: string): value is ShopVibeId {
  return value in VIBE_MAP;
}

const PROMO_COPY: Array<{ title: string; subtitle: string }> = [
  { title: "Free delivery on orders ₱500+", subtitle: "Metro Manila · Until 9 PM" },
  { title: "Opening promo — 10% off first orders", subtitle: "This week only · While stocks last" },
  { title: "Same-day delivery available", subtitle: "Order before 3 PM · GCash & COD accepted" },
  { title: "Buy 2, get free delivery", subtitle: "Automatic at checkout · No code needed" },
  { title: "Fresh drops every week", subtitle: "Follow us so you don't miss out" },
  { title: "GCash, Maya & COD accepted", subtitle: "Fast checkout · No app download needed" },
  { title: "New here? Say hi for a freebie 🎁", subtitle: "Message us after your first order" },
  { title: "Handled with care, shipped fast", subtitle: "Packed same day · Tracked delivery" },
];

const TAGLINE_PATTERNS: Array<(shopName: string, category: string) => string> = [
  (name) => `Welcome to ${name}`,
  (name) => `${name} — made with love, delivered fast`,
  (name, category) => `Your neighborhood ${category.toLowerCase()} shop`,
  (name) => `Thanks for dropping by ${name} 💚`,
  (name) => `${name} · order in seconds, no app needed`,
  (name, category) => `Small-batch ${category.toLowerCase()}, big heart`,
];

/** FNV-1a — tiny, stable, good spread for short strings. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number, salt: number): T {
  return items[(seed + salt * 2654435761) % items.length] as T;
}

const CATEGORY_VIBE_HINTS: Array<{ match: RegExp; vibe: ShopVibeId }> = [
  { match: /bakery|pastry|cake|dessert|sweet|home.?baking|vlog|recipe/i, vibe: "cute" },
  { match: /fashion|apparel|clothing|streetwear/i, vibe: "minimal" },
  { match: /beauty|skincare|cosmetic/i, vibe: "premium" },
  { match: /electronic|gadget|tech|gaming/i, vibe: "electric" },
  { match: /food|beverage|snack|drink/i, vibe: "bold" },
  { match: /handmade|craft|gift/i, vibe: "cute" },
];

export interface DeriveBrandKitInput {
  shopName: string;
  slug: string;
  category?: string;
  /** Seller-chosen vibe; falls back to a category-based guess, then hash rotation. */
  vibe?: string;
  subscriptionPlan?: string | null;
}

export interface DerivedBrandKit extends TenantThemeJson {
  patternId: import("./types").StorePatternId;
  templateId: ShopTemplateId;
  primaryColor: string;
  accentColor: string;
  paletteId: string;
  vibe: ShopVibeId;
}

export function deriveBrandKit(input: DeriveBrandKitInput): DerivedBrandKit {
  const category = input.category?.trim() || "General";
  const seed = hashString(`${input.slug}::${input.shopName.trim().toLowerCase()}`);

  let vibe: ShopVibe | undefined =
    input.vibe && isShopVibeId(input.vibe) ? VIBE_MAP[input.vibe] : undefined;
  if (!vibe) {
    const hint = CATEGORY_VIBE_HINTS.find((h) => h.match.test(category));
    vibe = hint ? VIBE_MAP[hint.vibe] : pick(SHOP_VIBES, seed, 1);
  }

  const plan = input.subscriptionPlan ?? "free";
  const allowedTemplates = vibe.templates.filter((id) => canUseTemplate(id, plan));
  const fallbackTemplates = SHOP_TEMPLATES.filter((t) => canUseTemplate(t.id, plan)).map(
    (t) => t.id
  );
  const templatePool = allowedTemplates.length > 0 ? allowedTemplates : fallbackTemplates;
  // Weight toward the vibe's first-choice template but let the hash spread shops across the pool.
  const templateId = pick(templatePool, seed, 2);

  const palettePool = BRAND_PALETTES.filter((p) => vibe.paletteIds.includes(p.id));
  const palette = pick(palettePool.length > 0 ? palettePool : BRAND_PALETTES, seed, 3);

  const promo = pick(PROMO_COPY, seed, 4);
  const taglineFn = pick(TAGLINE_PATTERNS, seed, 5);
  const patternId = matchStorePattern({
    category,
    vibe: vibe.id,
    templateId,
  });

  return {
    templateId,
    patternId,
    primaryColor: palette.primary,
    accentColor: palette.accent,
    paletteId: palette.id,
    vibe: vibe.id,
    tagline: taglineFn(input.shopName.trim(), category),
    promoTitle: promo.title,
    promoSubtitle: promo.subtitle,
  };
}

/**
 * Distinct starting identities the deterministic engine can produce
 * (before the seller touches a single setting):
 *   free plan  : 3 templates × 18 palettes × 8 promos × 6 taglines = 2,592
 *   growth plan: 6 templates → 5,184
 *   pro plan   : 9 templates → 7,776
 * With the shop-builder font picker (×3) and free-form color wheels the
 * space is effectively unbounded.
 */
export const BRAND_KIT_COMBINATIONS = {
  free: 3 * BRAND_PALETTES.length * PROMO_COPY.length * TAGLINE_PATTERNS.length,
  growth: 6 * BRAND_PALETTES.length * PROMO_COPY.length * TAGLINE_PATTERNS.length,
  pro: 9 * BRAND_PALETTES.length * PROMO_COPY.length * TAGLINE_PATTERNS.length,
};
