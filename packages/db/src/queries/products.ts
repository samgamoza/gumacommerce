import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { productImages, productVariants, products } from "../schema/index";

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  basePrice: string;
  status: string;
  stockQty: number;
  aiGenerated: boolean;
  imageUrl: string | null;
  createdAt: Date;
}

export interface CreateProductInput {
  title: string;
  slug: string;
  descriptionHtml?: string;
  basePrice: string;
  compareAtPrice?: string;
  status?: "draft" | "active";
  stockQty?: number;
  aiGenerated?: boolean;
  imageUrl?: string;
}

function normalizeProductSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function slugFromProductTitle(title: string): string {
  return normalizeProductSlug(title);
}

export async function listProductsForTenant(tenantId: string): Promise<ProductListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      basePrice: products.basePrice,
      status: products.status,
      aiGenerated: products.aiGenerated,
      createdAt: products.createdAt,
      stockQty: productVariants.stockQty,
      imageUrl: productVariants.imageUrl,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .where(eq(products.tenantId, tenantId))
    .orderBy(desc(products.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    basePrice: row.basePrice,
    status: row.status,
    stockQty: row.stockQty ?? 0,
    aiGenerated: row.aiGenerated ?? false,
    imageUrl: row.imageUrl ?? null,
    createdAt: row.createdAt,
  }));
}

export async function createProductForTenant(
  tenantId: string,
  input: CreateProductInput
): Promise<ProductListItem> {
  const db = getDb();
  const baseSlug = normalizeProductSlug(input.slug || slugFromProductTitle(input.title));
  let slug = baseSlug;
  let suffix = 2;
  while (!(await isProductSlugAvailable(tenantId, slug))) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  const status = input.status ?? "active";
  const stockQty = input.stockQty ?? 10;

  const [product] = await db
    .insert(products)
    .values({
      tenantId,
      title: input.title.trim(),
      slug,
      descriptionHtml: input.descriptionHtml?.trim() || `<p>${input.title.trim()}</p>`,
      status,
      basePrice: input.basePrice,
      compareAtPrice: input.compareAtPrice,
      aiGenerated: input.aiGenerated ?? false,
    })
    .returning();

  if (!product) throw new Error("Failed to create product");

  const [variant] = await db
    .insert(productVariants)
    .values({
      productId: product.id,
      sku: `${slug}-default`,
      title: "Default",
      price: input.basePrice,
      stockQty,
      optionsJson: { variant: "Default" },
      imageUrl: input.imageUrl,
    })
    .returning();

  if (!variant) throw new Error("Failed to create product variant");

  if (input.imageUrl) {
    await db.insert(productImages).values({
      productId: product.id,
      variantId: variant.id,
      url: input.imageUrl,
      alt: product.title,
      sortOrder: 0,
    });
  }

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    basePrice: product.basePrice,
    status: product.status,
    stockQty,
    aiGenerated: product.aiGenerated ?? false,
    imageUrl: input.imageUrl ?? null,
    createdAt: product.createdAt,
  };
}

export async function isProductSlugAvailable(tenantId: string, slug: string): Promise<boolean> {
  const db = getDb();
  const normalized = normalizeProductSlug(slug);
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.slug, normalized)))
    .limit(1);

  return existing.length === 0;
}

export { normalizeProductSlug };
