"use client";

import { useMemo, useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { ElectroProductCard } from "./electro-product-card";

const TABS = [
  { id: "all", label: "All Products" },
  { id: "new", label: "New Arrivals" },
  { id: "featured", label: "Featured" },
  { id: "bestseller", label: "Top Selling" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ElectroProductGrid({ tenant }: { tenant: DemoTenant }) {
  const [tab, setTab] = useState<TabId>("all");

  const filtered = useMemo(() => {
    switch (tab) {
      case "new":
        return tenant.products.filter((p) => p.tags.includes("new"));
      case "featured":
        return tenant.products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
      case "bestseller":
        return tenant.products.filter((p) => p.tags.includes("bestseller"));
      default:
        return tenant.products;
    }
  }, [tenant.products, tab]);

  const display = filtered.length > 0 ? filtered : tenant.products;

  return (
    <section className="electro-products-section" id="products">
      <div className="electro-container">
        <div className="electro-products-head">
          <h2>Our Products</h2>
          <div className="electro-tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`electro-tab ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {display.length === 0 ? (
          <p className="text-center text-[var(--electro-muted)]">No products yet — check back soon.</p>
        ) : (
          <div className="electro-product-grid">
            {display.map((product) => (
              <ElectroProductCard
                key={product.id}
                tenantSlug={tenant.slug}
                product={product}
                category={tenant.category}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
