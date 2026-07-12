import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

export function MinistoreHero({ tenant }: { tenant: DemoTenant }) {
  const shopHref = `/${tenant.slug}#mobile-products`;
  const heroImage =
    tenant.coverUrl ?? "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&q=80";

  return (
    <section className="ministore-hero">
      <div className="ministore-container-lg">
        <div className="ministore-hero-grid">
          <div>
            <h1>Your Gadgets Are Great.</h1>
            <p className="mb-6 max-w-md">{tenant.tagline}</p>
            <Link href={shopHref} className="ministore-btn-dark">
              Shop Products
            </Link>
          </div>
          <div className="ministore-hero-image">
            <Image src={heroImage} alt={tenant.name} fill sizes="(max-width: 992px) 100vw, 420px" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
