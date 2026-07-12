"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatWaggyPrice, waggyDiscount, waggyStarRating } from "./waggy-utils";

function WaggyProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;
  const badge =
    product.tags.includes("new") ? "New" : waggyDiscount(product.price, product.compareAtPrice);

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
    <article className="waggy-product-card">
      {badge && <span className="waggy-badge">{badge}</span>}
      <div className="waggy-product-img">
        <Link href={productHref}>
          <Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 50vw, 25vw" />
        </Link>
      </div>
      <h3>
        <Link href={productHref}>{product.title}</Link>
      </h3>
      <div className="waggy-product-rating">
        <Star className="inline h-4 w-4 fill-current" aria-hidden /> {waggyStarRating(product.id)}
      </div>
      <p className="waggy-product-price">{formatWaggyPrice(product.price)}</p>
      <button type="button" className="waggy-add-btn" onClick={handleAdd} disabled={!ready || adding}>
        {adding ? "Adding…" : "Add to Cart"}
      </button>
    </article>
  );
}

const TABS = [
  { id: "all", label: "All Products" },
  { id: "clothing", label: "Pet Clothing" },
  { id: "food", label: "Food & Treats" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function WaggyProductGrid({ tenant }: { tenant: DemoTenant }) {
  const [tab, setTab] = useState<TabId>("all");

  const filtered = useMemo(() => {
    switch (tab) {
      case "clothing":
        return tenant.products.filter((p) => /wear|hoodie|collar|leash|clothing|apparel/i.test(p.title));
      case "food":
        return tenant.products.filter((p) => /food|treat|kibble|snack|feed/i.test(p.title));
      default:
        return tenant.products;
    }
  }, [tenant.products, tab]);

  const display = filtered.length > 0 ? filtered : tenant.products;

  return (
    <section className="waggy-section" id="products">
      <div className="waggy-container-lg">
        <div className="waggy-section-head">
          <h2>Best selling products</h2>
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`waggy-btn ${tab === item.id ? "waggy-btn-primary" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {display.length === 0 ? (
          <p className="text-center">No products yet — check back soon.</p>
        ) : (
          <div className="waggy-product-grid">
            {display.map((product) => (
              <WaggyProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}

        <div className="waggy-promo">
          <h2>Everything your furry friend needs</h2>
          <p className="mb-4">{tenant.shopTheme.promoSubtitle}</p>
          <Link href={`/${tenant.slug}#products`} className="waggy-btn waggy-btn-primary">
            Shop Pet Essentials
          </Link>
        </div>
      </div>
    </section>
  );
}
