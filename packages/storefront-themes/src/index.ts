export {
  SHOP_TEMPLATES,
  SHOP_TEMPLATE_MAP,
  TIER_DESCRIPTIONS,
  TIER_LABELS,
  getShopTemplate,
  isShopTemplateId,
  listShopTemplatesByTier,
} from "./templates";
export { canUseTemplate, resolveShopTheme } from "./resolve-theme";
export {
  SHOP_TEMPLATE_IDS,
  type ResolvedShopTheme,
  type ShopCardStyle,
  type ShopHeaderStyle,
  type ShopHeroStyle,
  type ShopLayout,
  type ShopTemplateDefinition,
  type ShopTemplateId,
  type ShopTemplateTier,
  type TenantThemeJson,
} from "./types";
