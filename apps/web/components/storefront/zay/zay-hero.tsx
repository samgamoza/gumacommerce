"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { ZAY_HERO_IMAGES, zayBrandMark } from "./zay-utils";

export function ZayHero({ tenant }: { tenant: DemoTenant }) {
  const brand = zayBrandMark(tenant.name);
  const slides = useMemo(() => {
    const products = tenant.products.slice(0, 3);
    if (products.length === 0) {
      return [
        {
          title: (
            <>
              <strong>{brand.primary}</strong> {brand.rest}
            </>
          ),
          subtitle: tenant.shopTheme.promoTitle ?? "Your trusted online shop",
          description: tenant.tagline,
          image: tenant.coverUrl ?? ZAY_HERO_IMAGES[0]!,
          href: `/${tenant.slug}#featured`,
        },
      ];
    }
    return products.map((product, index) => ({
      title: product.title,
      subtitle: tenant.shopTheme.promoTitle ?? tenant.tagline,
      description: product.shortDescription,
      image: product.image || ZAY_HERO_IMAGES[index % ZAY_HERO_IMAGES.length]!,
      href: `/${tenant.slug}/products/${product.slug}`,
    }));
  }, [tenant, brand]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[active]!;

  return (
    <section className="zay-hero">
      <div className="zay-container">
        <div className={`zay-hero-slide ${active % 2 === 1 ? "reverse" : ""}`}>
          <div className="zay-hero-copy">
            <h1 className="zay-hero-title">{slide.title}</h1>
            <h2 className="zay-hero-sub">{slide.subtitle}</h2>
            <p className="zay-hero-desc">{slide.description}</p>
            <Link href={slide.href} className="zay-btn">
              Shop Now
            </Link>
          </div>
          <div className="zay-hero-visual">
            <Image src={slide.image} alt={typeof slide.title === "string" ? slide.title : tenant.name} width={640} height={420} priority />
          </div>
        </div>
        {slides.length > 1 && (
          <div className="zay-hero-controls">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`zay-hero-dot ${index === active ? "active" : ""}`}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
