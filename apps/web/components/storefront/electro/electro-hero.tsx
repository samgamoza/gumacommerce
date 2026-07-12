"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { ELECTRO_HERO_IMAGES, ELECTRO_SIDE_BANNER, formatElectroPrice } from "./electro-utils";

export function ElectroHero({ tenant }: { tenant: DemoTenant }) {
  const featured = tenant.products[0];
  const slides = useMemo(() => {
    const products = tenant.products.slice(0, 2);
    if (products.length === 0) {
      return [
        {
          kicker: tenant.shopTheme.promoTitle ?? "Special Offer",
          title: tenant.tagline,
          note: tenant.shopTheme.promoSubtitle ?? "Terms and conditions apply",
          image: tenant.coverUrl ?? ELECTRO_HERO_IMAGES[0]!,
          href: `/${tenant.slug}#products`,
        },
      ];
    }
    return products.map((product, index) => ({
      kicker: tenant.shopTheme.promoTitle ?? "Save Today",
      title: product.title,
      note: product.shortDescription,
      image: product.image || ELECTRO_HERO_IMAGES[index % ELECTRO_HERO_IMAGES.length]!,
      href: `/${tenant.slug}/products/${product.slug}`,
    }));
  }, [tenant]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => setActive((c) => (c + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[active]!;
  const sideProduct = featured ?? tenant.products[0];

  return (
    <section className="electro-hero">
      <div className="electro-hero-grid">
        <div className="electro-hero-carousel">
          <div className="electro-container">
            <div className="electro-hero-slide">
              <div>
                <Image src={slide.image} alt={typeof slide.title === "string" ? slide.title : tenant.name} width={560} height={400} className="w-full rounded" />
              </div>
              <div>
                <p className="electro-hero-kicker">{slide.kicker}</p>
                <h1 className="electro-hero-title">{slide.title}</h1>
                <p className="mb-4 text-[var(--electro-muted)]">{slide.note}</p>
                <Link href={slide.href} className="electro-btn">
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        <aside className="electro-hero-side relative hidden xl:block">
          <Image src={sideProduct?.image ?? ELECTRO_SIDE_BANNER} alt="Special offer" fill sizes="300px" className="object-cover" />
          <div className="electro-hero-side-offer">
            {sideProduct?.compareAtPrice && sideProduct.compareAtPrice > sideProduct.price && (
              <span className="electro-hero-side-badge">
                Save {formatElectroPrice(sideProduct.compareAtPrice - sideProduct.price)}
              </span>
            )}
            <span className="font-bold text-[var(--electro-primary)]">Special Offer</span>
          </div>
          {sideProduct && (
            <div className="electro-hero-side-content">
              <span className="mb-1 text-sm opacity-90">{sideProduct.category}</span>
              <strong className="mb-2 text-xl">{sideProduct.title}</strong>
              {sideProduct.compareAtPrice && (
                <del className="mr-2 opacity-80">{formatElectroPrice(sideProduct.compareAtPrice)}</del>
              )}
              <span className="text-lg font-bold text-[var(--electro-primary)]">{formatElectroPrice(sideProduct.price)}</span>
              <Link href={`/${tenant.slug}/products/${sideProduct.slug}`} className="electro-btn mt-4">
                Add To Cart
              </Link>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
