import Image from "next/image";
import Link from "next/link";
import type { DemoTenant } from "@/lib/demo-data";

const PROMOS = [
  {
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80",
    bg: "var(--fb-secondary)",
    title: "Fresh Apples",
    offer: "20% OFF",
    textColor: "#fff",
  },
  {
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80",
    bg: "var(--fb-light)",
    title: "Tasty Fruits",
    offer: "Free delivery",
    textColor: "var(--fb-primary)",
  },
  {
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
    bg: "var(--fb-primary)",
    title: "Exotic Vegetables",
    offer: "Save ₱300",
    textColor: "#fff",
  },
] as const;

export function FruitablesPromos({ tenant }: { tenant: DemoTenant }) {
  const shopHref = `/${tenant.slug}#products`;

  return (
    <section className="fruitables-promos">
      <div className="fruitables-container-lg">
        <div className="grid gap-4 md:grid-cols-3">
          {PROMOS.map((promo) => (
            <Link key={promo.title} href={shopHref} className="fruitables-promo">
              <div className="fruitables-promo-img">
                <Image src={promo.image} alt={promo.title} fill sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="fruitables-promo-label" style={{ background: promo.bg, color: promo.textColor }}>
                <h5>{promo.title}</h5>
                <h3>{promo.offer}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
