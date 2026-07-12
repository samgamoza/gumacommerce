import Image from "next/image";
import type { DemoTenant } from "@/lib/demo-data";
import { KAIRA_CATEGORY_IMAGES } from "./kaira-utils";

export function KairaCategoryBanners({ tenant }: { tenant: DemoTenant }) {
  const categories =
    tenant.shopCategories.length >= 3
      ? tenant.shopCategories.slice(0, 3)
      : [
          { id: "women", name: "Women", slug: "women" },
          { id: "men", name: "Men", slug: "men" },
          { id: "accessories", name: "Accessories", slug: "accessories" },
        ].map((c, i) => tenant.shopCategories[i] ?? c);

  const labels = ["Shop Collection", "Shop Collection", "Shop Accessories"];

  return (
    <section className="kaira-section">
      <div className="kaira-container">
        <div className="kaira-categories">
          {categories.map((category, index) => (
            <article key={category.id} className="kaira-category">
              <Image
                src={KAIRA_CATEGORY_IMAGES[index % KAIRA_CATEGORY_IMAGES.length]!}
                alt={category.name}
                width={400}
                height={530}
              />
              <div className="kaira-category-overlay">
                <a href="#products" className="kaira-btn">
                  {labels[index] ?? `Shop ${category.name}`}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
