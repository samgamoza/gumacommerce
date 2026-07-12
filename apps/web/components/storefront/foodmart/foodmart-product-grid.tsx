"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import {
  foodmartDiscount,
  foodmartStarRating,
  formatFoodmartPrice,
} from "./foodmart-utils";

function FoodmartProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;
  const badge = foodmartDiscount(product.price, product.compareAtPrice);

  async function handleAdd() {
    setAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image,
    });
    setAdding(false);
  }

  return (
    <article className="foodmart-product-card">
      {badge && <span className="foodmart-badge">{badge}</span>}
      <Link href={productHref}>
        <Image src={product.image} alt={product.title} width={200} height={200} />
      </Link>
      <h3>
        <Link href={productHref}>{product.title}</Link>
      </h3>
      <div className="foodmart-product-meta">
        <span>1 unit</span>
        <span>★ {foodmartStarRating(product.id)}</span>
      </div>
      <p className="foodmart-product-price">
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <del>{formatFoodmartPrice(product.compareAtPrice)}</del>
        )}
        {formatFoodmartPrice(product.price)}
      </p>
      <button type="button" className="foodmart-btn foodmart-add-btn" onClick={handleAdd} disabled={!ready || adding}>
        <ShoppingCart className="h-4 w-4" />
        {adding ? "Adding…" : "Add to Cart"}
      </button>
    </article>
  );
}

const TABS = [
  { id: "all", label: "All Products" },
  { id: "new", label: "New Arrivals" },
  { id: "sale", label: "On Sale" },
  { id: "best", label: "Best Sellers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function FoodmartProductGrid({ tenant }: { tenant: DemoTenant }) {
  const [tab, setTab] = useState<TabId>("all");

  const filtered = useMemo(() => {
    switch (tab) {
      case "new":
        return tenant.products.filter((p) => p.tags.includes("new"));
      case "sale":
        return tenant.products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
      case "best":
        return tenant.products.filter((p) => p.tags.includes("bestseller"));
      default:
        return tenant.products;
    }
  }, [tenant.products, tab]);

  const display = filtered.length > 0 ? filtered : tenant.products;

  return (
    <section className="foodmart-section" id="products">
      <div className="foodmart-container">
        <div className="foodmart-section-head">
          <h2>Trending Products</h2>
          <a href="#products" className="foodmart-link">
            View All →
          </a>
        </div>

        <div className="foodmart-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`foodmart-tab ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {display.length === 0 ? (
          <p className="text-center text-[var(--fm-muted)]">No products yet — check back soon.</p>
        ) : (
          <div className="foodmart-product-grid">
            {display.map((product) => (
              <FoodmartProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}

        <div className="foodmart-promo">
          <h2>
            Get <span className="highlight">10% discount</span> on your first purchase
          </h2>
          <p className="mb-4 text-[var(--fm-muted)]">{tenant.shopTheme.promoSubtitle}</p>
          <Link href={`/${tenant.slug}#products`} className="foodmart-btn">
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
