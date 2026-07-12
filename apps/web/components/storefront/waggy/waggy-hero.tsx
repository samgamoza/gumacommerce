import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DemoTenant } from "@/lib/demo-data";

export function WaggyHero({ tenant }: { tenant: DemoTenant }) {
  const shopHref = `/${tenant.slug}#products`;
  const heroImage =
    tenant.coverUrl ?? "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&q=80";

  return (
    <section className="waggy-hero">
      <div className="waggy-container-lg">
        <div className="waggy-hero-grid">
          <div className="waggy-hero-copy">
            <p className="eyebrow">Save 10–20% off</p>
            <h1>
              Best destination for <span className="highlight">your pets</span>
            </h1>
            <p>{tenant.tagline}</p>
            <Link href={shopHref} className="waggy-btn">
              Shop Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="waggy-hero-image">
            <Image src={heroImage} alt={tenant.name} fill sizes="(max-width: 992px) 100vw, 480px" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
