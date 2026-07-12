import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DemoTenant } from "@/lib/demo-data";

export function FruitablesHero({ tenant }: { tenant: DemoTenant }) {
  const shopHref = `/${tenant.slug}#products`;
  const heroImage =
    tenant.coverUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80";

  return (
    <section className="fruitables-hero">
      <div className="fruitables-container-lg">
        <div className="fruitables-hero-grid">
          <div>
            <p className="fruitables-hero-eyebrow">100% Organic Foods</p>
            <h1>Organic Veggies &amp; Fruits</h1>
            <Link href={shopHref} className="fruitables-hero-search">
              <span>Search fresh produce</span>
              <span className="fruitables-hero-cta">
                Shop Now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
          <div className="fruitables-hero-image">
            <Image src={heroImage} alt={tenant.name} fill sizes="(max-width: 992px) 100vw, 480px" priority />
            <span className="fruitables-hero-tag">Fresh Harvest</span>
          </div>
        </div>
      </div>
    </section>
  );
}
