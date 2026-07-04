export { db, getDb, closeDb, type Database } from "./client";
export { getDatabaseUrl, isNeonDatabase } from "./env";
export {
  getTenantStorefrontBySlug,
  getPendingTenantBySlug,
  type StorefrontTenantRecord,
  type PendingTenantRecord,
} from "./queries/storefront";
export {
  getTenantDashboard,
  activateTenantShop,
  type TenantDashboardData,
  type SetupStep,
} from "./queries/tenant-dashboard";
export {
  getTenantStorefrontSettings,
  updateTenantStorefront,
  type TenantStorefrontSettings,
  type UpdateTenantStorefrontInput,
} from "./queries/tenant-storefront";
export {
  getTenantSettings,
  updateTenantSettings,
  type TenantSettingsJson,
  type TenantSettingsRecord,
  type UpdateTenantSettingsInput,
} from "./queries/tenant-settings";
export {
  listProductsForTenant,
  createProductForTenant,
  isProductSlugAvailable,
  slugFromProductTitle,
  normalizeProductSlug,
  type ProductListItem,
  type CreateProductInput,
} from "./queries/products";
export {
  createCategoryForTenant,
  deleteCategoryForTenant,
  isCategorySlugAvailable,
  listCategoriesForTenant,
  slugFromCategoryName,
  type CategoryListItem,
} from "./queries/categories";
export {
  getRawAiUsageCounts,
  recordAiUsage,
  getTenantOwnerContact,
  type RawAiUsageCounts,
} from "./queries/ai-usage";
export {
  getOrderInsightsLast7d,
  getProductById,
  pickFeaturedProductId,
  type OrderInsights7d,
} from "./queries/order-insights";
export {
  listContentQueue,
  createContentQueueItem,
  updateContentQueueStatus,
  startAgentRun,
  finishAgentRun,
  listRecentAgentRuns,
  listActiveTenantsForAgents,
  saveShopChatMessage,
  getTenantIdBySlug,
  resolveAgentSettings,
  resolveShopAssistantSettings,
  DEFAULT_AGENT_SETTINGS,
  DEFAULT_SHOP_ASSISTANT,
  type ContentQueueItem,
  type AgentSettings,
  type ShopAssistantSettings,
} from "./queries/agents";
export * from "./schema/index";
