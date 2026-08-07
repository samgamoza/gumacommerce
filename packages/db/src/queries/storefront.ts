import { desc, eq } from "drizzle-orm";
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
  seoPublishedJson: import("../types/tenant-seo").TenantSeoJson | null;
  checkoutPublishedJson: import("../types/tenant-checkout").TenantCheckoutJson | null;
  shippingPublishedJson: import("../types/tenant-shipping").TenantShippingJson | null;
  products: Array<{
    id: string;
    slug: string;
    title: string;
    descriptionHtml: string | null;
    basePrice: string;
    compareAtPrice: string | null;
    status: string;
    isMain: boolean;
    imageUrl: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    metadataJson: {
      unitType?: "pc" | "box" | "other";
      unitCustom?: string;
      servicePriceStyle?: "base_minimum" | "value_range";
    } | null;
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

/** Pending Launch shops only — suspended tenants use getTenantAvailabilityBySlug. */
export async function getPendingTenantBySlug(
  slug: string
): Promise<PendingTenantRecord | null> {
  const availability = await getTenantAvailabilityBySlug(slug);
  if (!availability || availability.status !== "pending") return null;
  return availability;
}

/** Lightweight public status lookup for storefront / checkout gates. */
export async function getTenantAvailabilityBySlug(
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

  return tenant ?? null;
}

export async function getTenantStatusById(tenantId: string): Promise<string | null> {
  const db = getDb();
  const [tenant] = await db
    .select({ status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return tenant?.status ?? null;
}

export async function getTenantStorefrontBySlug(
  slug: string
): Promise<StorefrontTenantRecord | null> {
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!tenant || tenant.status !== "active") return null;

  return mapStorefrontTenant(tenant);
}

/** Draft/preview access for Launch — allows pending shops to preview before activate. */
export async function getTenantStorefrontPreviewBySlug(
  slug: string
): Promise<StorefrontTenantRecord | null> {
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!tenant || (tenant.status !== "active" && tenant.status !== "pending")) return null;

  return mapStorefrontTenant(tenant, { preferDraft: true });
}

async function mapStorefrontTenant(
  tenant: typeof tenants.$inferSelect,
  options?: { preferDraft?: boolean }
): Promise<StorefrontTenantRecord> {
  const db = getDb();
  const catalogRows = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      descriptionHtml: products.descriptionHtml,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      status: products.status,
      isMain: products.isMain,
      metadataJson: products.metadataJson,
      imageUrl: productVariants.imageUrl,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.tenantId, tenant.id))
    .orderBy(desc(products.isMain), desc(products.createdAt));

  // Variant join can duplicate rows — keep first (main-sorted) per product.
  const seen = new Set<string>();
  const catalog = catalogRows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  const shopCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.tenantId, tenant.id));

  const themeJson = options?.preferDraft
    ? tenant.themeDraftJson ?? tenant.themePublishedJson ?? tenant.themeJson
    : tenant.themePublishedJson ?? tenant.themeJson;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    category: tenant.category,
    coverUrl: tenant.coverUrl,
    logoUrl: tenant.logoUrl,
    themeJson,
    currency: tenant.currency,
    subscriptionPlan: tenant.subscriptionPlan,
    settingsJson: tenant.settingsJson,
    seoPublishedJson: tenant.seoPublishedJson ?? null,
    checkoutPublishedJson: tenant.checkoutPublishedJson ?? null,
    shippingPublishedJson: tenant.shippingPublishedJson ?? null,
    products: catalog.map((p) => ({
      ...p,
      isMain: Boolean(p.isMain),
      metadataJson: p.metadataJson ?? null,
    })),
    shopCategories,
  };
}
