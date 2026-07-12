import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function FruitablesBanner({ tenant }: { tenant: DemoTenant }) {
  const shopHref = `/${tenant.slug}#products`;

  return (
    <section className="fruitables-banner">
      <div className="fruitables-container-lg">
        <div className="fruitables-banner-grid">
          <div>
            <h2>Fresh Exotic Fruits</h2>
            <p className="subtitle">in Our Store</p>
            <p className="mb-4 text-[var(--fb-dark)]">{tenant.shopTheme.promoSubtitle}</p>
            <Link href={shopHref} className="fruitables-banner-btn">
              Shop Fresh Produce
            </Link>
          </div>
          <div className="fruitables-banner-image">
            <Image
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80"
              alt="Fresh fruits"
              fill
              sizes="360px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
