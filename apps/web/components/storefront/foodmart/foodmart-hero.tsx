import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";
import { FOODMART_HERO_IMAGES } from "./foodmart-utils";

export function FoodmartHero({ tenant }: { tenant: DemoTenant }) {
  const featured = tenant.products[0];
  const heroImage = featured?.image ?? tenant.coverUrl ?? FOODMART_HERO_IMAGES[0]!;

  return (
    <section className="foodmart-hero-section">
      <div className="foodmart-container foodmart-hero-grid">
        <div className="foodmart-hero-card foodmart-hero-main">
          <div className="foodmart-hero-kicker">100% fresh</div>
          <h2 className="foodmart-hero-title">{tenant.shopTheme.promoTitle ?? "Fresh Groceries Delivered Daily"}</h2>
          <p className="mb-4 text-sm leading-relaxed">{tenant.tagline}</p>
          <Link href={`/${tenant.slug}#products`} className="foodmart-btn foodmart-btn-outline">
            Shop Now
          </Link>
          <div className="mt-4 hidden md:block">
            <Image src={heroImage} alt="" width={280} height={200} className="rounded-lg object-cover" />
          </div>
        </div>

        <div className="foodmart-hero-card foodmart-hero-side-a">
          <div className="foodmart-hero-kicker">20% off</div>
          <h3 className="foodmart-hero-title text-lg">Fruits & Vegetables</h3>
          <Link href={`/${tenant.slug}#products`} className="foodmart-link">
            Shop Collection →
          </Link>
        </div>

        <div className="foodmart-hero-card foodmart-hero-side-b">
          <div className="foodmart-hero-kicker">15% off</div>
          <h3 className="foodmart-hero-title text-lg">Baked & Pantry</h3>
          <Link href={`/${tenant.slug}#products`} className="foodmart-link">
            Shop Collection →
          </Link>
        </div>
      </div>
    </section>
  );
}
