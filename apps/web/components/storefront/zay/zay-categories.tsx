import Image from "next/image";
import type { DemoTenant } from "@/lib/demo-data";
import { ZAY_CATEGORY_IMAGES } from "./zay-utils";

function dedupeCategories(
  categories: Array<{ id: string; name: string; slug: string }>
): Array<{ id: string; name: string; slug: string }> {
  const seen = new Set<string>();
  const unique: Array<{ id: string; name: string; slug: string }> = [];
  for (const cat of categories) {
    const key = cat.slug || cat.id || cat.name;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(cat);
  }
  return unique;
}

export function ZayCategories({ tenant }: { tenant: DemoTenant }) {
  const categories =
    tenant.shopCategories.length > 0
      ? dedupeCategories(tenant.shopCategories).slice(0, 3)
      : [...new Set(tenant.products.map((p) => p.category).filter(Boolean))].slice(0, 3).map((name, i) => ({
          id: `cat-${i}`,
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
        }));

  if (categories.length === 0) return null;

  return (
    <section className="zay-section" id="categories">
      <div className="zay-container">
        <h2 className="zay-section-title">Categories of The Month</h2>
        <p className="zay-section-lead">
          Browse our most popular collections — curated picks from {tenant.name}.
        </p>
        <div className="zay-categories">
          {categories.map((category, index) => (
            <article key={`${category.id}-${index}`} className="zay-category-card">
              <Image
                src={ZAY_CATEGORY_IMAGES[index % ZAY_CATEGORY_IMAGES.length]!}
                alt={category.name}
                width={180}
                height={180}
                className="mx-auto"
              />
              <h3>{category.name}</h3>
              <p className="mt-3">
                <a href="#featured" className="zay-btn zay-btn-sm">
                  Go Shop
                </a>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
