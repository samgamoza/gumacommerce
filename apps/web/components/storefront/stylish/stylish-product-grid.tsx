"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatStylishPrice } from "./stylish-utils";

function StylishProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
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
    <article className="stylish-product-card">
      <div className="stylish-product-img">
        <Link href={productHref}>
          <Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 50vw, 20vw" />
        </Link>
        <div className="stylish-product-actions">
          <button type="button" className="stylish-action-btn" onClick={handleAdd} disabled={!ready || adding} aria-label="Add to cart">
            <ShoppingBag className="h-4 w-4" />
          </button>
          <Link href={productHref} className="stylish-action-btn" aria-label="View product">
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="stylish-product-detail">
        <h3>
          <Link href={productHref}>{product.title}</Link>
        </h3>
        <span className="stylish-product-price">{formatStylishPrice(product.price)}</span>
      </div>
    </article>
  );
}

function StylishProductSection({
  tenant,
  title,
  products,
  sectionId,
}: {
  tenant: DemoTenant;
  title: string;
  products: DemoProduct[];
  sectionId?: string;
}) {
  const display = products.length > 0 ? products : tenant.products.slice(0, 5);
  if (display.length === 0) return null;

  return (
    <section className="stylish-section" id={sectionId}>
      <div className="stylish-container-md">
        <div className="stylish-section-head">
          <h2>{title}</h2>
          <a href="#products" className="stylish-link">
            View all
          </a>
        </div>
        <div className="stylish-product-grid">
          {display.slice(0, 5).map((product) => (
            <StylishProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function StylishProductGrid({ tenant }: { tenant: DemoTenant }) {
  const featured = tenant.products.filter((p) => p.tags.includes("bestseller"));
  const latest = tenant.products.filter((p) => p.tags.includes("new"));

  return (
    <>
      <StylishProductSection tenant={tenant} title="Featured Products" products={featured} sectionId="products" />
      <StylishProductSection tenant={tenant} title="Latest Products" products={latest} />
    </>
  );
}
