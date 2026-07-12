import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";
import { KAIRA_BANNER_IMAGES } from "./kaira-utils";

export function KairaHero({ tenant }: { tenant: DemoTenant }) {
  const productItems = tenant.products.slice(0, 3).map((product, index) => ({
    title: product.title,
    description: product.shortDescription,
    image: product.image || KAIRA_BANNER_IMAGES[index % KAIRA_BANNER_IMAGES.length]!,
    href: `/${tenant.slug}/products/${product.slug}`,
  }));

  const items =
    productItems.length > 0
      ? productItems
      : [
          {
            title: tenant.shopTheme.promoTitle ?? "New Collection",
            description: tenant.tagline,
            image: tenant.coverUrl ?? KAIRA_BANNER_IMAGES[0]!,
            href: `/${tenant.slug}#products`,
          },
        ];

  return (
    <section className="kaira-section kaira-section-light">
      <div className="kaira-container">
        <h1 className="kaira-section-title">New Collections</h1>
        <p className="kaira-section-lead">{tenant.tagline}</p>
        <div className="kaira-hero-grid">
          {items.map((item) => (
            <article key={item.href} className="kaira-hero-card">
              <Link href={item.href}>
                <Image src={item.image} alt={item.title} width={400} height={530} />
              </Link>
              <h3>
                <Link href={item.href}>{item.title}</Link>
              </h3>
              <p className="line-clamp-2 text-sm">{item.description}</p>
              <p className="mt-3">
                <Link href={item.href} className="kaira-link">
                  Discover Now
                </Link>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
