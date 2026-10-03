import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { productVariants, products, stockMovements } from "../schema/index";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type StockMovementReason = (typeof stockMovements.$inferInsert)["reason"];

/**
 * Appends one ledger row. Call it in the SAME transaction as the stock_qty
 * change it describes, so the ledger and the counter can never disagree.
 * Zero deltas are skipped (the table rejects them).
 */
export async function recordStockMovement(
  tx: Tx,
  input: {
    tenantId: string;
    variantId: string;
    reason: StockMovementReason;
    delta: number;
    balanceAfter?: number | null;
    orderId?: string | null;
    actorId?: string | null;
    note?: string | null;
  }
): Promise<void> {
  if (!Number.isInteger(input.delta) || input.delta === 0) return;
  await tx.insert(stockMovements).values({
    tenantId: input.tenantId,
    variantId: input.variantId,
    reason: input.reason,
    delta: input.delta,
    balanceAfter: input.balanceAfter ?? null,
    orderId: input.orderId ?? null,
    actorId: input.actorId ?? null,
    note: input.note?.slice(0, 200) ?? null,
  });
}

export interface StockMovementItem {
  id: string;
  variantId: string;
  orderId: string | null;
  reason: StockMovementReason;
  delta: number;
  balanceAfter: number | null;
  note: string | null;
  createdAt: Date;
}

/** Recent movements for one of the seller's products (newest first). */
export async function listStockMovementsForProduct(
  tenantId: string,
  productId: string,
  limit = 50
): Promise<StockMovementItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: stockMovements.id,
      variantId: stockMovements.variantId,
      orderId: stockMovements.orderId,
      reason: stockMovements.reason,
      delta: stockMovements.delta,
      balanceAfter: stockMovements.balanceAfter,
      note: stockMovements.note,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(productVariants, eq(productVariants.id, stockMovements.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(stockMovements.tenantId, tenantId), eq(products.id, productId)))
    .orderBy(desc(stockMovements.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
  return rows;
}
