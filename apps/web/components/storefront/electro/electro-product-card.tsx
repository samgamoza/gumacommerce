"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DemoProduct } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { electroStarRating, formatElectroPrice } from "./electro-utils";

export function ElectroProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;
  const stars = electroStarRating(product.id);
  const badge = product.tags.includes("new") ? "New" : product.tags.includes("bestseller") ? "Sale" : null;

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
    <article className="electro-product-card">
      <div className="electro-product-inner">
        <div className="electro-product-image-wrap">
          <Link href={productHref}>
            <Image src={product.image} alt={product.title} width={320} height={320} />
          </Link>
          {badge && <span className={`electro-product-badge ${badge === "New" ? "new" : ""}`}>{badge}</span>}
        </div>
        <div className="electro-product-body">
          <Link href={productHref} className="electro-product-category">
            {product.category}
          </Link>
          <Link href={productHref} className="electro-product-title">
            {product.title}
          </Link>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <del className="electro-price-old">{formatElectroPrice(product.compareAtPrice)}</del>
          )}
          <span className="electro-price-new">{formatElectroPrice(product.price)}</span>
        </div>
      </div>
      <div className="electro-product-footer">
        <button type="button" className="electro-btn" onClick={handleAdd} disabled={!ready || adding}>
          {adding ? "Adding…" : "Add To Cart"}
        </button>
        <div className="electro-stars" aria-label={`${stars} out of 5 stars`}>
          {"★".repeat(stars)}
          {"☆".repeat(5 - stars)}
        </div>
      </div>
    </article>
  );
}
