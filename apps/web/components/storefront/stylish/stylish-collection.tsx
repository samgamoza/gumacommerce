import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

const COLLECTIONS = [
  {
    title: "Minimal Collection",
    image: "https://images.unsplash.com/photo-1603487742131-4160ec998306?w=900&q=80",
  },
  {
    title: "Sneakers Collection",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&q=80",
  },
] as const;

export function StylishCollection({ tenant }: { tenant: DemoTenant }) {
  const shopHref = `/${tenant.slug}#products`;

  return (
    <section className="stylish-collections" id="collections">
      <div className="stylish-container-md">
        <div className="stylish-collection-grid">
          {COLLECTIONS.map((collection) => (
            <div key={collection.title} className="stylish-collection-card">
              <Image src={collection.image} alt={collection.title} fill sizes="(max-width: 768px) 100vw, 50vw" />
              <div className="stylish-collection-content">
                <h3>{collection.title}</h3>
                <Link href={shopHref}>Shop Now</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
