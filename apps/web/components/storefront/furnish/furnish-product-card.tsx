"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DemoProduct } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatFurnishPrice } from "./furnish-utils";

export function FurnishProductCard({
  tenantSlug,
  product,
}: {
  tenantSlug: string;
  product: DemoProduct;
}) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
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
    <article className="furnish-product-card">
      <Link href={productHref}>
        <Image
          src={product.image}
          alt={product.title}
          width={400}
          height={400}
          className="h-auto w-full"
        />
      </Link>
      <h3>
        <Link href={productHref}>{product.title}</Link>
      </h3>
      <div className="furnish-price-row">
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="furnish-price-old">{formatFurnishPrice(product.compareAtPrice)}</span>
        )}
        <span className="furnish-price-new">{formatFurnishPrice(product.price)}</span>
      </div>
      <div className="furnish-product-actions">
        <button type="button" className="furnish-btn furnish-btn-outline" onClick={handleAdd} disabled={!ready || adding}>
          {adding ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
