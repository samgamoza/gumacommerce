export const SHOP_TEMPLATE_IDS = [
  "clean-guma",
  "mono-market",
  "blush-bakery",
  "neon-bazaar",
  "street-cart",
  "magazine-rack",
  "glass-future",
  "y2k-chrome",
  "holo-grid",
] as const;

export type ShopTemplateId = (typeof SHOP_TEMPLATE_IDS)[number];
export type ShopTemplateTier = "basic" | "standard" | "advanced";
export type ShopLayout = "classic" | "hero-stack" | "bento" | "editorial" | "immersive";
export type ShopHeaderStyle = "standard" | "floating-glass" | "minimal" | "split" | "sticker";
export type ShopCardStyle = "row" | "grid" | "glass-tile" | "brutal" | "magazine";
export type ShopHeroStyle = "gradient" | "mesh" | "chrome" | "noise" | "photo";

export type ShopDisplayFont = "bricolage" | "system" | "mono-accent";

export interface TenantThemeJson {
  templateId?: string;
  primaryColor?: string;
  accentColor?: string;
  displayFont?: ShopDisplayFont;
  tagline?: string;
  promoTitle?: string;
  promoSubtitle?: string;
}

export interface ShopTemplateDefinition {
  id: ShopTemplateId;
  tier: ShopTemplateTier;
  label: string;
  description: string;
  mood: string;
  tags: string[];
  previewGradient: string;
  minPlan: "free" | "growth" | "pro";
  layout: ShopLayout;
  header: ShopHeaderStyle;
  card: ShopCardStyle;
  hero: ShopHeroStyle;
  tokens: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    muted: string;
    border: string;
    mode: "light" | "dark";
    radius: string;
    displayFont: ShopDisplayFont;
  };
}

export interface ResolvedShopTheme {
  templateId: ShopTemplateId;
  tier: ShopTemplateTier;
  label: string;
  layout: ShopLayout;
  header: ShopHeaderStyle;
  card: ShopCardStyle;
  hero: ShopHeroStyle;
  tagline: string;
  promoTitle: string;
  promoSubtitle: string;
  primaryColor: string;
  accentColor: string;
  background: string;
  foreground: string;
  cardBackground: string;
  muted: string;
  border: string;
  mode: "light" | "dark";
  radius: string;
  displayFont: ShopDisplayFont;
  previewGradient: string;
}
