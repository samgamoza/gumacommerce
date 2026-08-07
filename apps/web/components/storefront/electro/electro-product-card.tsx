"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DemoProduct } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { productCardCtaLabel, productCardPricing } from "@/lib/product-price-display";
import { electroStarRating, formatElectroPrice } from "./electro-utils";

export function ElectroProductCard({
  tenantSlug,
  product,
  category,
}: {
  tenantSlug: string;
  product: DemoProduct;
  category?: string | null;
}) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;
  const stars = electroStarRating(product.id);
  const pricing = productCardPricing(category, product, formatElectroPrice);
  const ctaLabel = productCardCtaLabel(category);
  const badge = product.isMain
    ? "Main"
    : product.tags.includes("new")
      ? "New"
      : product.tags.includes("bestseller")
        ? "Sale"
        : pricing.kind === "service"
          ? "Service"
          : null;

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
          <Link href={productHref} aria-label={`View ${product.title}`}>
            <Image src={product.image} alt={product.title} width={320} height={320} />
          </Link>
          {badge && (
            <span className={`electro-product-badge ${badge === "New" || badge === "Main" ? "new" : ""}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="electro-product-body">
          <Link href={productHref} className="electro-product-category">
            {product.category}
          </Link>
          <Link href={productHref} className="electro-product-title">
            {product.title}
          </Link>
          {product.shortDescription ? (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--electro-muted)]">{product.shortDescription}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            {pricing.compareAtLine && (
              <del className="electro-price-old">{pricing.compareAtLine}</del>
            )}
            <span className="electro-price-new">{pricing.priceLine}</span>
          </div>
          {pricing.priceCaption && pricing.kind !== "food" && (
            <p className="mt-0.5 text-[11px] text-[var(--electro-muted)]">{pricing.priceCaption}</p>
          )}
        </div>
      </div>
      <div className="electro-product-footer">
        <button type="button" className="electro-btn" onClick={handleAdd} disabled={!ready || adding}>
          {adding ? "Adding…" : ctaLabel}
        </button>
        <div className="electro-stars" aria-label={`${stars} out of 5 stars`}>
          {"★".repeat(stars)}
          {"☆".repeat(5 - stars)}
        </div>
      </div>
    </article>
  );
}
