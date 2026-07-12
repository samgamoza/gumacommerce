import type { DemoTenant } from "@/lib/demo-data";
import { ZayProductCard } from "./zay-product-card";

export function ZayProductGrid({ tenant }: { tenant: DemoTenant }) {
  return (
    <section className="zay-section zay-products-section" id="featured">
      <div className="zay-container">
        <h2 className="zay-section-title">Featured Product</h2>
        <p className="zay-section-lead">
          {tenant.shopTheme.promoSubtitle ?? "Hand-picked items from our catalog — order today with COD available."}
        </p>
        {tenant.products.length === 0 ? (
          <p className="text-center">No products yet — check back soon.</p>
        ) : (
          <div className="zay-product-grid">
            {tenant.products.map((product) => (
              <ZayProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
