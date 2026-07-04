import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "../client";
import { orderItems, orders, products } from "../schema/index";

export interface OrderInsights7d {
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
  priorOrderCount: number;
  trend: "up" | "down" | "flat";
  topProducts: Array<{ title: string; quantity: number; productId: string | null }>;
  suggestedFocus: "bestseller" | "slow_week" | "steady";
  insightLines: string[];
}

export async function getOrderInsightsLast7d(tenantId: string): Promise<OrderInsights7d> {
  const db = getDb();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [current] = await db
    .select({
      orderCount: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, sevenDaysAgo)));

  const [prior] = await db
    .select({ orderCount: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        gte(orders.createdAt, fourteenDaysAgo),
        lt(orders.createdAt, sevenDaysAgo)
      )
    );

  const topProducts = await db
    .select({
      productId: orderItems.productId,
      title: orderItems.titleSnapshot,
      quantity: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, sevenDaysAgo)))
    .groupBy(orderItems.productId, orderItems.titleSnapshot)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(3);

  const orderCount = current?.orderCount ?? 0;
  const revenue = Number(current?.revenue ?? 0);
  const priorOrderCount = prior?.orderCount ?? 0;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  let trend: OrderInsights7d["trend"] = "flat";
  if (orderCount > priorOrderCount) trend = "up";
  else if (orderCount < priorOrderCount) trend = "down";

  let suggestedFocus: OrderInsights7d["suggestedFocus"] = "steady";
  if (orderCount === 0) suggestedFocus = "slow_week";
  else if (topProducts.length > 0) suggestedFocus = "bestseller";

  const insightLines: string[] = [];
  if (orderCount === 0) {
    insightLines.push("No orders in the last 7 days — push a promo or bestseller post today.");
  } else {
    insightLines.push(
      `${orderCount} order${orderCount === 1 ? "" : "s"} this week · ${formatPhp(revenue)} revenue`
    );
    if (topProducts[0]) {
      insightLines.push(`Top seller: ${topProducts[0].title} (${topProducts[0].quantity} sold)`);
    }
    if (trend === "down") {
      insightLines.push("Orders slowed vs last week — consider a flash sale or bundle.");
    } else if (trend === "up") {
      insightLines.push("Momentum is up — double down on what's working.");
    }
  }

  return {
    orderCount,
    revenue,
    avgOrderValue,
    priorOrderCount,
    trend,
    topProducts: topProducts.map((p) => ({
      title: p.title,
      quantity: p.quantity,
      productId: p.productId,
    })),
    suggestedFocus,
    insightLines,
  };
}

export async function pickFeaturedProductId(
  tenantId: string,
  productIds: string[]
): Promise<string | null> {
  if (productIds.length === 0) return null;
  const insights = await getOrderInsightsLast7d(tenantId);
  if (insights.topProducts[0]?.productId) return insights.topProducts[0].productId;
  return productIds[0] ?? null;
}

function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

export async function getProductById(tenantId: string, productId: string) {
  const db = getDb();
  const [product] = await db
    .select({
      id: products.id,
      title: products.title,
      basePrice: products.basePrice,
      slug: products.slug,
    })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)))
    .limit(1);
  return product ?? null;
}
