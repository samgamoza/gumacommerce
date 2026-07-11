import { resolveShopThemeForPlan, resolveStorePattern } from "@guma-commerce/storefront-themes";
import { getPendingTenantBySlug, getTenantStorefrontBySlug } from "@guma-commerce/db";
import {
  DEMO_TENANT,
  type DemoProduct,
  type DemoTenant,
  getTenant as getDemoTenant,
} from "./demo-data";
import { getModelStoreTenant, MODEL_STORE_SLUG } from "./model-store-tenant";
import { resolveStorefrontSettings } from "./storefront-settings";

const CATEGORY_EMOJI: Record<string, string> = {
  "Food & Beverage": "🍽️",
  Fashion: "👗",
  "Fashion & Apparel": "👗",
  "Beauty & Skincare": "💄",
  "Handmade & Crafts": "🎨",
  Electronics: "📱",
  General: "🛍️",
};

export async function getStorefrontTenant(slug: string): Promise<DemoTenant | null> {
  if (slug === MODEL_STORE_SLUG) return getModelStoreTenant();

  const demo = getDemoTenant(slug);
  if (demo) return demo;

  const tenant = await getTenantStorefrontBySlug(slug);
  if (!tenant) return null;

  const mappedProducts: DemoProduct[] = tenant.products
    .filter((product) => product.status === "active")
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      shortDescription: product.descriptionHtml?.replace(/<[^>]+>/g, "") ?? "",
      price: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
      image: product.imageUrl ?? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
      category: product.categoryName ?? tenant.category ?? "Products",
      categorySlug: product.categorySlug ?? undefined,
      tags: [],
    }));

  const shopTheme = resolveShopThemeForPlan(
    tenant.themeJson,
    tenant.name,
    tenant.subscriptionPlan
  );
  const storeSettings = resolveStorefrontSettings(tenant.settingsJson, tenant.currency ?? "PHP");
  const patternId = resolveStorePattern(tenant.themeJson);

  return {
    slug: tenant.slug,
    name: tenant.name,
    tagline: shopTheme.tagline,
    category: tenant.category ?? "General",
    location: "Philippines",
    logoEmoji: CATEGORY_EMOJI[tenant.category ?? "General"] ?? "🛍️",
    logoUrl: tenant.logoUrl ?? undefined,
    theme: {
      primaryColor: shopTheme.primaryColor,
      accentColor: shopTheme.accentColor,
    },
    shopTheme,
    patternId,
    shopCategories: tenant.shopCategories,
    coverUrl: tenant.coverUrl ?? undefined,
    codEnabled: storeSettings.codEnabled,
    storeSettings,
    products: mappedProducts,
    subscriptionPlan: tenant.subscriptionPlan,
  };
}

export async function getStorefrontProduct(
  tenantSlug: string,
  productSlug: string
): Promise<{ tenant: DemoTenant; product: DemoProduct } | null> {
  const tenant = await getStorefrontTenant(tenantSlug);
  if (!tenant) return null;

  const product = tenant.products.find((item) => item.slug === productSlug);
  if (!product) return null;

  return { tenant, product };
}

export async function getPendingStorefrontTenant(
  slug: string
): Promise<{ slug: string; name: string } | null> {
  if (getDemoTenant(slug)) return null;

  const pending = await getPendingTenantBySlug(slug);
  if (!pending) return null;

  return { slug: pending.slug, name: pending.name };
}

/** @deprecated Use getStorefrontTenant in server components */
export { DEMO_TENANT };
