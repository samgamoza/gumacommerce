export {
  DEFAULT_SHOP_BUSINESS_CATEGORY,
  SHOP_BUSINESS_CATEGORIES,
  SHOP_CATEGORY_EMOJI,
  emojiForShopCategory,
  type ShopBusinessCategory,
} from "./shop-categories";
export {
  SHOP_TEMPLATES,
  SHOP_TEMPLATE_MAP,
  TIER_DESCRIPTIONS,
  TIER_LABELS,
  getShopTemplate,
  isShopTemplateId,
  listShopTemplatesByTier,
  normalizeShopTemplateId,
} from "./templates";
export {
  canUseTemplate,
  resolveShopTheme,
  resolveShopThemeForPlan,
} from "./resolve-theme";
export {
  BRAND_KIT_COMBINATIONS,
  BRAND_PALETTES,
  SHOP_VIBES,
  deriveBrandKit,
  isShopVibeId,
  type BrandPalette,
  type DeriveBrandKitInput,
  type DerivedBrandKit,
  type ShopVibe,
  type ShopVibeId,
} from "./brand-kit";
export {
  SIMPLY_SWEET_HERO_STYLES,
  SIMPLY_SWEET_SECTION_FLAGS,
  SIMPLY_SWEET_VARIATION_COUNT,
  STORE_PATTERN_MAP,
  STORE_PATTERNS,
  getStorePattern,
  isStorePatternId,
  matchStorePattern,
  resolvePatternThemeDefaults,
  resolveStorePattern,
} from "./patterns";
export {
  SHOP_TEMPLATE_IDS,
  STORE_PATTERN_IDS,
  type DashboardRenderer,
  type ResolvedShopTheme,
  type ShopDisplayFont,
  type ShopCardStyle,
  type ShopHeaderStyle,
  type ShopHeroStyle,
  type ShopLayout,
  type ShopTemplateDefinition,
  type ShopTemplateId,
  type ShopTemplateTier,
  type StorePatternDefinition,
  type StorePatternId,
  type StorefrontRenderer,
  type TenantThemeJson,
} from "./types";
export {
  getTemplateRegistryEntry,
  STOREFRONT_TEMPLATE_REGISTRY,
  type StorefrontTemplateRegistryEntry,
} from "./template-registry";
export {
  BUNDLE_2023_CATALOG,
  BUNDLE_2023_LICENSE,
  BUNDLE_2023_SOURCE,
  BUNDLE_2023_STATS,
  getBundleCatalogEntry,
  listBundleByCategory,
  listBundleByStatus,
  listPriorityPortQueue,
  type BundleTemplateCatalogEntry,
  type BundleTemplateStatus,
  type StorefrontFit,
} from "./bundle-catalog";
export {
  buildStoreDNA,
  type LaunchStep,
  type ProductCountHint,
  type SellingChannel,
  type StoreDNA,
  type StoreGoal,
} from "./store-dna";
export {
  TEMPLATE_PACKAGES,
  getTemplatePackage,
  type ConversionFocus,
  type TemplatePackageMetadata,
} from "./template-packages";
export {
  recommendTemplates,
  listLibraryMatchesForDna,
  type RankedTemplate,
  type TemplateScoreBreakdown,
} from "./recommend-templates";
export {
  TEMPLATE_PREVIEW_IMAGES,
  previewImageForTemplate,
  previewImageForCategory,
} from "./template-previews";
export {
  BRAND_GUARD_PALETTE_ALLOWLIST,
  brandGuardHasErrors,
  hintBrandGuardCopy,
  lintBrandGuardCopy,
  validateBrandGuardPersonalize,
  type BrandGuardIssue,
  type BrandGuardPersonalizeInput,
  type BrandGuardSeverity,
} from "./brand-guard";
