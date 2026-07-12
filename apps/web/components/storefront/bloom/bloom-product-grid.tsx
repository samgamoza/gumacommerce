import type { DemoTenant } from "@/lib/demo-data";
import { BloomProductCard } from "./bloom-product-card";

export function BloomProductGrid({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;

  if (tenant.products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="text-xl font-semibold">No products yet</h3>
        <p className="mt-2 text-muted-foreground">Check back soon — new items are on the way.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tenant.products.map((product) => (
        <BloomProductCard
          key={product.id}
          tenantSlug={tenant.slug}
          product={product}
          primary={primary}
        />
      ))}
    </div>
  );
}
