import type { DemoTenant } from "@/lib/demo-data";
import { FurnishProductCard } from "./furnish-product-card";

export function FurnishProductGrid({ tenant }: { tenant: DemoTenant }) {
  return (
    <section className="furnish-section" id="collection">
      <div className="furnish-container">
        <h2 className="furnish-section-title">Our Favourite Collection</h2>
        <p className="furnish-section-lead">
          {tenant.tagline ||
            "Inspired by the realities of life today, where traditional divides between personal and professional space are more fluid."}
        </p>

        {tenant.products.length === 0 ? (
          <p className="mt-8 text-center">No products yet — check back soon.</p>
        ) : (
          <div className="furnish-product-grid">
            {tenant.products.map((product) => (
              <FurnishProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
