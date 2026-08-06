import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../client";
import {
  shopBusinessCategories,
  templateIntelligenceEvents,
  templateStock,
} from "../schema/index";

export type ShopCategoryStatus = "enabled" | "disabled";
export type TemplateStockStatus = "draft" | "approved" | "published" | "archived";
export type TemplateStockSource = "free_bundle" | "ops_manual" | "ai_curated";

export type ShopBusinessCategoryRow = typeof shopBusinessCategories.$inferSelect;
export type TemplateStockRow = typeof templateStock.$inferSelect;

export function slugifyShopCategory(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Seed onboarding categories from the code allowlist when the table is empty. */
export async function ensureShopCategoriesSeeded(
  labels: readonly string[]
): Promise<{ seeded: boolean; count: number }> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shopBusinessCategories);
  if (count > 0) {
    // Keep ops table in sync when code allowlist gains new labels
    await syncMissingShopCategories(labels);
    const [{ count: next }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shopBusinessCategories);
    return { seeded: false, count: next };
  }

  if (labels.length === 0) return { seeded: false, count: 0 };

  await db.insert(shopBusinessCategories).values(
    labels.map((label, index) => ({
      slug: slugifyShopCategory(label),
      label,
      status: "enabled" as const,
      sortOrder: index,
      minVariants: 3,
      targetVariants: 5,
    }))
  );

  return { seeded: true, count: labels.length };
}

/** Insert any code-allowlist labels missing from the ops table (never deletes). */
export async function syncMissingShopCategories(labels: readonly string[]): Promise<number> {
  if (labels.length === 0) return 0;
  const db = getDb();
  const existing = await db
    .select({ label: shopBusinessCategories.label })
    .from(shopBusinessCategories);
  const have = new Set(existing.map((r) => r.label));
  const missing = labels.filter((l) => !have.has(l));
  if (missing.length === 0) return 0;

  const [{ maxSort }] = await db
    .select({ maxSort: sql<number>`coalesce(max(${shopBusinessCategories.sortOrder}), 0)::int` })
    .from(shopBusinessCategories);

  await db.insert(shopBusinessCategories).values(
    missing.map((label, index) => ({
      slug: slugifyShopCategory(label),
      label,
      status: "enabled" as const,
      sortOrder: maxSort + 1 + index,
      minVariants: 3,
      targetVariants: 5,
      notes: "Synced from platform allowlist",
    }))
  );
  return missing.length;
}

export async function listShopBusinessCategories(options?: {
  enabledOnly?: boolean;
}): Promise<ShopBusinessCategoryRow[]> {
  const db = getDb();
  if (options?.enabledOnly) {
    return db
      .select()
      .from(shopBusinessCategories)
      .where(eq(shopBusinessCategories.status, "enabled"))
      .orderBy(asc(shopBusinessCategories.sortOrder), asc(shopBusinessCategories.label));
  }
  return db
    .select()
    .from(shopBusinessCategories)
    .orderBy(asc(shopBusinessCategories.sortOrder), asc(shopBusinessCategories.label));
}

/** Labels for signup / Launch dropdowns. Falls back to caller list when DB empty. */
export async function listOnboardingCategoryLabels(
  fallbackLabels: readonly string[]
): Promise<string[]> {
  await ensureShopCategoriesSeeded(fallbackLabels);
  const rows = await listShopBusinessCategories({ enabledOnly: true });
  if (rows.length === 0) return [...fallbackLabels];
  return rows.map((r) => r.label);
}

export async function upsertShopBusinessCategory(input: {
  id?: string;
  label: string;
  status?: ShopCategoryStatus;
  sortOrder?: number;
  minVariants?: number;
  targetVariants?: number;
  notes?: string | null;
}): Promise<ShopBusinessCategoryRow> {
  const db = getDb();
  const label = input.label.trim();
  if (!label) throw new Error("Category label is required.");
  const slug = slugifyShopCategory(label);
  const minVariants = Math.max(1, Math.min(20, input.minVariants ?? 3));
  const targetVariants = Math.max(minVariants, Math.min(40, input.targetVariants ?? 5));

  if (input.id) {
    const [updated] = await db
      .update(shopBusinessCategories)
      .set({
        label,
        slug,
        status: input.status ?? "enabled",
        sortOrder: input.sortOrder ?? 0,
        minVariants,
        targetVariants,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(shopBusinessCategories.id, input.id))
      .returning();
    if (!updated) throw new Error("Category not found.");
    return updated;
  }

  const [created] = await db
    .insert(shopBusinessCategories)
    .values({
      slug,
      label,
      status: input.status ?? "enabled",
      sortOrder: input.sortOrder ?? 999,
      minVariants,
      targetVariants,
      notes: input.notes ?? null,
    })
    .onConflictDoUpdate({
      target: shopBusinessCategories.label,
      set: {
        status: input.status ?? "enabled",
        sortOrder: input.sortOrder ?? 999,
        minVariants,
        targetVariants,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return created;
}

export async function setShopCategoryStatus(
  id: string,
  status: ShopCategoryStatus
): Promise<ShopBusinessCategoryRow> {
  const db = getDb();
  const [updated] = await db
    .update(shopBusinessCategories)
    .set({ status, updatedAt: new Date() })
    .where(eq(shopBusinessCategories.id, id))
    .returning();
  if (!updated) throw new Error("Category not found.");
  return updated;
}

export async function listTemplateStock(options?: {
  categoryLabel?: string;
  statuses?: TemplateStockStatus[];
}): Promise<TemplateStockRow[]> {
  const db = getDb();
  const conditions = [];
  if (options?.categoryLabel) {
    conditions.push(eq(templateStock.categoryLabel, options.categoryLabel));
  }
  if (options?.statuses?.length) {
    conditions.push(inArray(templateStock.status, options.statuses));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  return db
    .select()
    .from(templateStock)
    .where(where)
    .orderBy(desc(templateStock.updatedAt));
}

export async function getTemplateStockByKey(
  stockKey: string
): Promise<TemplateStockRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(templateStock)
    .where(eq(templateStock.stockKey, stockKey))
    .limit(1);
  return row ?? null;
}

export async function createTemplateStock(input: {
  stockKey: string;
  label: string;
  categoryId?: string | null;
  categoryLabel: string;
  liveTemplateId: string;
  status?: TemplateStockStatus;
  source?: TemplateStockSource;
  sourceRef?: string | null;
  notes?: string | null;
  previewImageUrl?: string | null;
  storeLookJson?: TemplateStockRow["storeLookJson"];
  createdByUserId?: string | null;
}): Promise<TemplateStockRow> {
  const db = getDb();
  const stockKey = input.stockKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!stockKey) throw new Error("stockKey is required.");
  const status = input.status ?? "draft";
  const [row] = await db
    .insert(templateStock)
    .values({
      stockKey,
      label: input.label.trim(),
      categoryId: input.categoryId ?? null,
      categoryLabel: input.categoryLabel.trim(),
      liveTemplateId: input.liveTemplateId.trim(),
      status,
      source: input.source ?? "ops_manual",
      sourceRef: input.sourceRef ?? null,
      notes: input.notes ?? null,
      previewImageUrl: input.previewImageUrl ?? null,
      storeLookJson: input.storeLookJson ?? null,
      createdByUserId: input.createdByUserId ?? null,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();
  return row;
}

export async function setTemplateStockStatus(
  id: string,
  status: TemplateStockStatus
): Promise<TemplateStockRow> {
  const db = getDb();
  const [updated] = await db
    .update(templateStock)
    .set({
      status,
      publishedAt: status === "published" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(templateStock.id, id))
    .returning();
  if (!updated) throw new Error("Template stock not found.");
  return updated;
}

export async function countPublishedStockByCategory(): Promise<Map<string, number>> {
  const db = getDb();
  const rows = await db
    .select({
      categoryLabel: templateStock.categoryLabel,
      count: sql<number>`count(*)::int`,
    })
    .from(templateStock)
    .where(eq(templateStock.status, "published"))
    .groupBy(templateStock.categoryLabel);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.categoryLabel, row.count);
  }
  return map;
}

export async function recordTemplateIntelligenceEvent(input: {
  eventType: string;
  categoryLabel?: string | null;
  stockKey?: string | null;
  tenantId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(templateIntelligenceEvents).values({
    eventType: input.eventType,
    categoryLabel: input.categoryLabel ?? null,
    stockKey: input.stockKey ?? null,
    tenantId: input.tenantId ?? null,
    payloadJson: input.payload ?? null,
  });
}

export async function listRecentTemplateIntelligenceEvents(limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(templateIntelligenceEvents)
    .orderBy(desc(templateIntelligenceEvents.createdAt))
    .limit(limit);
}
