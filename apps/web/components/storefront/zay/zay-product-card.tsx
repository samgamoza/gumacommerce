"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DemoProduct } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatZayPrice } from "./zay-utils";

function starRating(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % 5;
  return Math.max(3, hash + 1);
}

export function ZayProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;
  const stars = starRating(product.id);

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
    <article className="zay-product-card">
      <Link href={productHref}>
        <Image src={product.image} alt={product.title} width={400} height={300} />
      </Link>
      <div className="zay-product-body">
        <ul className="zay-product-meta">
          <li className="zay-stars" aria-label={`${stars} out of 5 stars`}>
            {"★".repeat(stars)}
            {"☆".repeat(5 - stars)}
          </li>
          <li className="zay-product-price">{formatZayPrice(product.price)}</li>
        </ul>
        <Link href={productHref} className="zay-product-title">
          {product.title}
        </Link>
        <p className="zay-product-desc">{product.shortDescription}</p>
        <div className="zay-product-actions">
          <Link href={productHref} className="zay-btn zay-btn-sm">
            View
          </Link>
          <button type="button" className="zay-btn zay-btn-sm" onClick={handleAdd} disabled={!ready || adding}>
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
