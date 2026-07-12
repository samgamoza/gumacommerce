"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatKairaPrice } from "./kaira-utils";

function KairaProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
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
    <article className="kaira-product-card">
      <Link href={productHref}>
        <Image src={product.image} alt={product.title} width={320} height={420} />
      </Link>
      <h5>
        <Link href={productHref}>{product.title}</Link>
      </h5>
      <p className="kaira-product-price">
        <button type="button" onClick={handleAdd} disabled={!ready || adding}>
          {adding ? "Adding…" : formatKairaPrice(product.price)}
        </button>
      </p>
    </article>
  );
}

export function KairaProductRow({
  tenant,
  title,
  filter,
}: {
  tenant: DemoTenant;
  title: string;
  filter: (products: DemoProduct[]) => DemoProduct[];
}) {
  const products = filter(tenant.products).slice(0, 4);
  const display = products.length > 0 ? products : tenant.products.slice(0, 4);

  if (display.length === 0) return null;

  return (
    <section className="kaira-section kaira-section-light" id={title === "Our New Arrivals" ? "products" : undefined}>
      <div className="kaira-container">
        <div className="kaira-row-head">
          <h4>{title}</h4>
          <a href="#products" className="kaira-link">
            View All Products
          </a>
        </div>
        <div className="kaira-product-grid">
          {display.map((product) => (
            <KairaProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
