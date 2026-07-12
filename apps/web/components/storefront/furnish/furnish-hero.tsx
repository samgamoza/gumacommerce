"use client";

import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";
import { discountLabel, formatFurnishPrice } from "./furnish-utils";

export function FurnishHero({ tenant }: { tenant: DemoTenant }) {
  const featured = tenant.products[0];
  const saleLabel =
    featured?.compareAtPrice && featured.compareAtPrice > featured.price
      ? discountLabel(featured.price, featured.compareAtPrice)
      : tenant.shopTheme.promoTitle?.match(/\d+%/)?.[0]
        ? `${tenant.shopTheme.promoTitle.match(/\d+%/)![0]} OFF`
        : "New Arrival";

  const title = featured?.title ?? tenant.shopTheme.promoTitle ?? tenant.name;
  const description = featured?.shortDescription ?? tenant.tagline;
  const price = featured?.price;
  const image =
    featured?.image ??
    tenant.coverUrl ??
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80";
  const productHref = featured ? `/${tenant.slug}/products/${featured.slug}` : `/${tenant.slug}#collection`;

  return (
    <section className="furnish-hero">
      <div className="furnish-container">
        <div className="furnish-hero-grid">
          <div>
            <p className="furnish-hero-sale">{saleLabel}</p>
            <h1 className="furnish-hero-title">{title}</h1>
            <p className="furnish-hero-desc">{description}</p>
            {price != null && <p className="furnish-hero-price">{formatFurnishPrice(price)}</p>}
            <Link href={productHref} className="furnish-btn">
              View Details
            </Link>
          </div>
          <div className="furnish-hero-visual">
            <Image
              src={image}
              alt={title}
              width={640}
              height={480}
              className="mx-auto max-h-[420px] w-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
