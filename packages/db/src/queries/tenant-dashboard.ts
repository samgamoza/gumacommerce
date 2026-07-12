import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "../client";
import { categories, orders, products, tenants, users } from "../schema/index";

export type TenantStatus = "pending" | "active" | "suspended";

export interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
  href?: string;
  action?: string;
}

export interface TenantDashboardData {
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: string;
    category: string | null;
    createdAt: Date;
  };
  stats: {
    totalSales: number;
    orderCount: number;
    productCount: number;
    activeProductCount: number;
  };
  setup: {
    steps: SetupStep[];
    progressPercent: number;
    canActivate: boolean;
  };
}

function hasPayMongoConfigured(): boolean {
  const key = process.env.PAYMONGO_SECRET_KEY ?? "";
  return key.length > 0 && !key.includes("xxx");
}

export async function getTenantDashboard(tenantId: string, userId: string): Promise<TenantDashboardData | null> {
  const db = getDb();

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const allProducts = await db
    .select({ status: products.status })
    .from(products)
    .where(eq(products.tenantId, tenantId));

  const productCount = allProducts.length;
  const activeProductCount = allProducts.filter((p) => p.status === "active").length;

  const [categoryStats] = await db
    .select({ total: count() })
    .from(categories)
    .where(eq(categories.tenantId, tenantId));
  const categoryCount = categoryStats?.total ?? 0;

  const [orderStats] = await db
    .select({
      total: count(),
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(eq(orders.tenantId, tenantId));

  const orderCount = orderStats?.total ?? 0;
  const totalSales = Number(orderStats?.revenue ?? 0);
  const emailVerified = Boolean(user.emailVerifiedAt);
  const paymentsConfigured = hasPayMongoConfigured();

  const steps: SetupStep[] = [
    { id: "shop", label: "Create your shop", completed: true },
    {
      id: "email",
      label: "Verify your email",
      completed: emailVerified,
      href: "/onboarding",
      action: emailVerified ? undefined : "Verify",
    },
    {
      id: "categories",
      label: "Create product categories",
      completed: categoryCount > 0,
      href: "/categories",
      action: categoryCount > 0 ? undefined : "Add categories",
    },
    {
      id: "branding",
      label: "Launch your storefront",
      completed: Boolean(tenant.themePublishedJson?.templateId || tenant.themeJson?.templateId),
      href: "/launch",
      action:
        tenant.themePublishedJson?.templateId || tenant.themeJson?.templateId
          ? undefined
          : "Open Launch",
    },
    {
      id: "product",
      label: "Add your first product",
      completed: productCount > 0,
      href: "/products",
      action: productCount > 0 ? undefined : "Add product",
    },
    {
      id: "payments",
      label: "Activate payments (PayMongo)",
      completed: paymentsConfigured,
      action: paymentsConfigured ? undefined : "Coming soon",
    },
    {
      id: "activate",
      label: "Activate your shop",
      completed: tenant.status === "active",
      action: tenant.status === "active" ? undefined : "Activate",
    },
  ];

  const completedCount = steps.filter((step) => step.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const canActivate =
    tenant.status !== "active" && tenant.status !== "suspended" && activeProductCount > 0;

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      category: tenant.category,
      createdAt: tenant.createdAt,
    },
    stats: {
      totalSales,
      orderCount,
      productCount,
      activeProductCount,
    },
    setup: {
      steps,
      progressPercent,
      canActivate,
    },
  };
}

/**
 * Flip pending → active once the shop has at least one active product.
 * Sellers expect "View shop" to work after adding listings without a separate activate click.
 */
export async function tryAutoActivateTenant(tenantId: string): Promise<boolean> {
  const db = getDb();
  const [tenant] = await db
    .select({ id: tenants.id, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!tenant || tenant.status === "active" || tenant.status === "suspended") {
    return false;
  }

  const [stats] = await db
    .select({ total: count() })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.status, "active")));

  if ((stats?.total ?? 0) < 1) return false;

  await db
    .update(tenants)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  return true;
}

export async function activateTenantShop(tenantId: string, userId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const dashboard = await getTenantDashboard(tenantId, userId);
  if (!dashboard) return { ok: false, reason: "Shop not found." };
  if (dashboard.tenant.status === "active") return { ok: true };
  if (!dashboard.setup.canActivate) {
    return {
      ok: false,
      reason: "Add at least one active product before activating your shop.",
    };
  }

  const db = getDb();
  await db
    .update(tenants)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  return { ok: true };
}
