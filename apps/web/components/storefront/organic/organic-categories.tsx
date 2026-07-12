import Image from "next/image";
import type { DemoTenant } from "@/lib/demo-data";

const CATEGORY_IMAGES = [
  "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80",
  "https://images.unsplash.com/photo-1566385101042-f36664c57d94?w=200&q=80",
  "https://images.unsplash.com/photo-1598170845058-32b9d6a594c0?w=200&q=80",
  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&q=80",
  "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=200&q=80",
  "https://images.unsplash.com/photo-1559188667-42c6486a793f?w=200&q=80",
] as const;

export function OrganicCategories({ tenant }: { tenant: DemoTenant }) {
  const categories =
    tenant.shopCategories.length > 0
      ? tenant.shopCategories
      : [
          { id: "veg", name: "Vegetables", slug: "vegetables" },
          { id: "fruit", name: "Fruits", slug: "fruits" },
          { id: "herbs", name: "Herbs", slug: "herbs" },
        ];

  return (
    <section className="organic-section" id="categories">
      <div className="organic-container-lg">
        <div className="organic-section-head">
          <h2>Category</h2>
          <a href="#products" className="organic-btn organic-btn-primary">
            View All
          </a>
        </div>

        <div className="organic-categories">
          {categories.map((category, index) => (
            <a key={category.id} href="#products" className="organic-category">
              <Image
                src={CATEGORY_IMAGES[index % CATEGORY_IMAGES.length]}
                alt={category.name}
                width={88}
                height={88}
              />
              <span>{category.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
