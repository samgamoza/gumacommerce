"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatOrganicPrice, organicStarRating } from "./organic-utils";

function OrganicProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;

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
    <article className="organic-product-card">
      <figure>
        <Link href={productHref}>
          <Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 50vw, 20vw" />
        </Link>
      </figure>
      <h3>
        <Link href={productHref}>{product.title}</Link>
      </h3>
      <div className="organic-product-rating">
        <Star className="inline h-4 w-4 fill-current" aria-hidden /> {organicStarRating(product.id)}
      </div>
      <p className="organic-product-price">
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <del>{formatOrganicPrice(product.compareAtPrice)}</del>
        )}
        {formatOrganicPrice(product.price)}
      </p>
      <button type="button" className="organic-add-btn" onClick={handleAdd} disabled={!ready || adding}>
        {adding ? "Adding…" : "Add to Cart"}
      </button>
    </article>
  );
}

const TABS = [
  { id: "all", label: "Best Selling" },
  { id: "new", label: "New Harvest" },
  { id: "sale", label: "On Sale" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function OrganicProductGrid({ tenant }: { tenant: DemoTenant }) {
  const [tab, setTab] = useState<TabId>("all");

  const filtered = useMemo(() => {
    switch (tab) {
      case "new":
        return tenant.products.filter((p) => p.tags.includes("new"));
      case "sale":
        return tenant.products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
      default:
        return tenant.products.filter((p) => p.tags.includes("bestseller"));
    }
  }, [tenant.products, tab]);

  const display = filtered.length > 0 ? filtered : tenant.products;

  return (
    <section className="organic-section pt-0" id="products">
      <div className="organic-container-lg">
        <div className="organic-section-head">
          <h2>Best selling products</h2>
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`organic-btn ${tab === item.id ? "organic-btn-primary" : "organic-btn-outline"}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {display.length === 0 ? (
          <p className="text-center text-[var(--og-muted)]">No products yet — check back soon.</p>
        ) : (
          <div className="organic-product-grid">
            {display.map((product) => (
              <OrganicProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}

        <div className="organic-promo">
          <h2>
            Get <span className="text-[var(--og-primary)]">10% off</span> your first farm box order
          </h2>
          <p className="mb-4 text-[var(--og-muted)]">{tenant.shopTheme.promoSubtitle}</p>
          <Link href={`/${tenant.slug}#products`} className="organic-btn organic-btn-primary">
            Shop Fresh Produce
          </Link>
        </div>
      </div>
    </section>
  );
}
