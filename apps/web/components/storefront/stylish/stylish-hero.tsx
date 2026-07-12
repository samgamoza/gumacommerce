import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

const SIDE_BANNERS = [
  {
    title: "Sports Wear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80",
  },
  {
    title: "Fashion Shoes",
    image: "https://images.unsplash.com/photo-1606107557195-0fa42b838e10?w=900&q=80",
  },
] as const;

export function StylishHero({ tenant }: { tenant: DemoTenant }) {
  const heroImage =
    tenant.coverUrl ?? "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80";
  const shopHref = `/${tenant.slug}#products`;

  return (
    <section className="stylish-hero">
      <div className="stylish-container">
        <div className="stylish-hero-grid">
          <div className="stylish-hero-card">
            <Image src={heroImage} alt={tenant.name} fill sizes="(max-width: 992px) 100vw, 55vw" priority />
            <div className="stylish-hero-content">
              <h2>{tenant.shopTheme.promoTitle}</h2>
              <Link href={shopHref} className="stylish-hero-link">
                Shop Now
              </Link>
            </div>
          </div>

          <div className="stylish-hero-stack">
            {SIDE_BANNERS.map((banner) => (
              <div key={banner.title} className="stylish-hero-card">
                <Image src={banner.image} alt={banner.title} fill sizes="(max-width: 992px) 100vw, 45vw" />
                <div className="stylish-hero-content">
                  <h2 style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}>{banner.title}</h2>
                  <Link href={shopHref} className="stylish-hero-link">
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
