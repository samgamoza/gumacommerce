import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { categories, products } from "../schema/index";

export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
}

function normalizeCategorySlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function slugFromCategoryName(name: string): string {
  return normalizeCategorySlug(name);
}

export async function listCategoriesForTenant(tenantId: string): Promise<CategoryListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
      productId: products.id,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(eq(categories.tenantId, tenantId))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const map = new Map<string, CategoryListItem>();
  for (const row of rows) {
    const existing = map.get(row.id);
    if (existing) {
      if (row.productId) existing.productCount += 1;
      continue;
    }
    map.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sortOrder ?? 0,
      productCount: row.productId ? 1 : 0,
    });
  }

  return [...map.values()];
}

export async function isCategorySlugAvailable(
  tenantId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.tenantId, tenantId), eq(categories.slug, slug)))
    .limit(1);

  if (rows.length === 0) return true;
  if (excludeId && rows[0]?.id === excludeId) return true;
  return false;
}

export async function createCategoryForTenant(
  tenantId: string,
  input: { name: string; slug?: string; sortOrder?: number }
): Promise<CategoryListItem> {
  const db = getDb();
  const baseSlug = normalizeCategorySlug(input.slug || slugFromCategoryName(input.name));
  let slug = baseSlug;
  let suffix = 2;
  while (!(await isCategorySlugAvailable(tenantId, slug))) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const [category] = await db
    .insert(categories)
    .values({
      tenantId,
      name: input.name.trim(),
      slug,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  if (!category) throw new Error("Failed to create category");

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder ?? 0,
    productCount: 0,
  };
}

export async function deleteCategoryForTenant(
  tenantId: string,
  categoryId: string
): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.tenantId, tenantId)))
    .returning({ id: categories.id });

  return result.length > 0;
}
