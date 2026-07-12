import type { DemoTenant } from "@/lib/demo-data";
import { FOODMART_CATEGORY_EMOJI } from "./foodmart-utils";

export function FoodmartCategories({ tenant }: { tenant: DemoTenant }) {
  const categories =
    tenant.shopCategories.length > 0
      ? tenant.shopCategories
      : [...new Set(tenant.products.map((p) => p.category))].slice(0, 8).map((name, i) => ({
          id: `cat-${i}`,
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
        }));

  if (categories.length === 0) return null;

  return (
    <section className="foodmart-section" id="categories">
      <div className="foodmart-container">
        <div className="foodmart-section-head">
          <h2>Category</h2>
          <a href="#products" className="foodmart-link">
            View All Categories →
          </a>
        </div>
        <div className="foodmart-categories">
          {categories.map((cat, index) => (
            <a key={cat.id} href="#products" className="foodmart-category-card">
              <span>{FOODMART_CATEGORY_EMOJI[index % FOODMART_CATEGORY_EMOJI.length]}</span>
              <h3>{cat.name}</h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
