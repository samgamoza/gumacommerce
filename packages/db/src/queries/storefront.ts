import { eq } from "drizzle-orm";
import { getDb } from "../client";
import { categories, productVariants, products, tenants } from "../schema/index";

export interface StorefrontTenantRecord {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  themeJson: {
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    templateId?: string;
    tagline?: string;
    promoTitle?: string;
    promoSubtitle?: string;
  } | null;
  currency: string;
  subscriptionPlan: string | null;
  settingsJson: import("../types/tenant-settings").TenantSettingsJson | null;
  products: Array<{
    id: string;
    slug: string;
    title: string;
    descriptionHtml: string | null;
    basePrice: string;
    compareAtPrice: string | null;
    status: string;
    imageUrl: string | null;
    categoryName: string | null;
    categorySlug: string | null;
  }>;
  shopCategories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface PendingTenantRecord {
  slug: string;
  name: string;
  status: string;
}

export async function getPendingTenantBySlug(
  slug: string
): Promise<PendingTenantRecord | null> {
  const db = getDb();
  const [tenant] = await db
    .select({
      slug: tenants.slug,
      name: tenants.name,
      status: tenants.status,
    })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant || tenant.status === "active") return null;
  return tenant;
}

export async function getTenantStorefrontBySlug(
  slug: string
): Promise<StorefrontTenantRecord | null> {
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!tenant || tenant.status !== "active") return null;

  const catalog = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      descriptionHtml: products.descriptionHtml,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      status: products.status,
      imageUrl: productVariants.imageUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.tenantId, tenant.id));

  const shopCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.tenantId, tenant.id));

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    category: tenant.category,
    coverUrl: tenant.coverUrl,
    logoUrl: tenant.logoUrl,
    themeJson: tenant.themeJson,
    currency: tenant.currency,
    subscriptionPlan: tenant.subscriptionPlan,
    settingsJson: tenant.settingsJson,
    products: catalog,
    shopCategories,
  };
}
