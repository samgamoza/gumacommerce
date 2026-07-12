import { Bird, Cat, Dog, Fish, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DemoTenant } from "@/lib/demo-data";

const DEFAULT_CATEGORIES: { icon: LucideIcon; label: string }[] = [
  { icon: UtensilsCrossed, label: "Pet Food" },
  { icon: Bird, label: "Bird Shop" },
  { icon: Dog, label: "Dog Shop" },
  { icon: Fish, label: "Fish Shop" },
  { icon: Cat, label: "Cat Shop" },
];

export function WaggyCategories({ tenant }: { tenant: DemoTenant }) {
  const categories =
    tenant.shopCategories.length >= 3
      ? tenant.shopCategories.slice(0, 5).map((cat, index) => ({
          icon: DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].icon,
          label: cat.name,
        }))
      : DEFAULT_CATEGORIES;

  return (
    <section className="waggy-categories" id="categories">
      <div className="waggy-container-lg">
        <div className="waggy-category-grid">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <a key={category.label} href="#products" className="waggy-category">
                <Icon className="waggy-category-icon mx-auto h-10 w-10" aria-hidden />
                <h3>{category.label}</h3>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
