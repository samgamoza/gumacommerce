import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { orderItems, productImages, productVariants, products } from "../schema/index";

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  descriptionHtml: string | null;
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
      compareAtPrice: products.compareAtPrice,
      descriptionHtml: products.descriptionHtml,
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

  // The variant left join can produce one row per variant; keep the first.
  const seen = new Set<string>();
  const items: ProductListItem[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    items.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      basePrice: row.basePrice,
      compareAtPrice: row.compareAtPrice ?? null,
      descriptionHtml: row.descriptionHtml ?? null,
      status: row.status,
      stockQty: row.stockQty ?? 0,
      aiGenerated: row.aiGenerated ?? false,
      imageUrl: row.imageUrl ?? null,
      createdAt: row.createdAt,
    });
  }
  return items;
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
    compareAtPrice: product.compareAtPrice ?? null,
    descriptionHtml: product.descriptionHtml ?? null,
    status: product.status,
    stockQty,
    aiGenerated: product.aiGenerated ?? false,
    imageUrl: input.imageUrl ?? null,
    createdAt: product.createdAt,
  };
}

export interface UpdateProductInput {
  title?: string;
  descriptionHtml?: string;
  basePrice?: string;
  compareAtPrice?: string | null;
  status?: "draft" | "active" | "archived";
  stockQty?: number;
  imageUrl?: string | null;
}

export async function updateProductForTenant(
  tenantId: string,
  productId: string,
  input: UpdateProductInput
): Promise<boolean> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [product] = await tx
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);
    if (!product) return false;

    await tx
      .update(products)
      .set({
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.descriptionHtml !== undefined
          ? { descriptionHtml: input.descriptionHtml }
          : {}),
        ...(input.basePrice !== undefined ? { basePrice: input.basePrice } : {}),
        ...(input.compareAtPrice !== undefined
          ? { compareAtPrice: input.compareAtPrice }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Keep the default (first) variant in sync for price/stock/image.
    const [variant] = await tx
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .limit(1);

    if (variant) {
      await tx
        .update(productVariants)
        .set({
          ...(input.basePrice !== undefined ? { price: input.basePrice } : {}),
          ...(input.stockQty !== undefined ? { stockQty: input.stockQty } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        })
        .where(eq(productVariants.id, variant.id));
    }

    if (input.imageUrl) {
      const [image] = await tx
        .select({ id: productImages.id })
        .from(productImages)
        .where(eq(productImages.productId, productId))
        .limit(1);
      if (image) {
        await tx
          .update(productImages)
          .set({ url: input.imageUrl })
          .where(eq(productImages.id, image.id));
      } else {
        await tx.insert(productImages).values({
          productId,
          variantId: variant?.id,
          url: input.imageUrl,
          sortOrder: 0,
        });
      }
    }

    return true;
  });
}

export type DeleteProductResult = "deleted" | "archived" | "not_found";

/**
 * Hard-deletes a product when nothing references it. Products that appear in
 * past orders are archived instead (order_items.product_id has no cascade),
 * which also hides them from the storefront.
 */
export async function deleteProductForTenant(
  tenantId: string,
  productId: string
): Promise<DeleteProductResult> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [product] = await tx
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);
    if (!product) return "not_found";

    const [referenced] = await tx
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.productId, productId))
      .limit(1);

    if (referenced) {
      await tx
        .update(products)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(products.id, productId));
      return "archived";
    }

    // product_images.variant_id references product_variants without a cascade,
    // so remove images first, then variants, then the product row.
    await tx.delete(productImages).where(eq(productImages.productId, productId));
    await tx.delete(productVariants).where(eq(productVariants.productId, productId));
    await tx.delete(products).where(eq(products.id, productId));
    return "deleted";
  });
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
