"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatFruitablesPrice } from "./fruitables-utils";

function FruitablesProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;

  async function handleAdd() {
    setAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image,
    });
    setAdding(false);
  }

  return (
    <article className="fruitables-product-card">
      <div className="fruitables-product-img">
        <Link href={productHref}>
          <Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 50vw, 25vw" />
        </Link>
        <span className="fruitables-product-badge">{product.category}</span>
      </div>
      <div className="fruitables-product-body">
        <h4>
          <Link href={productHref}>{product.title}</Link>
        </h4>
        <p>{product.shortDescription}</p>
        <div className="fruitables-product-footer">
          <p className="fruitables-product-price">{formatFruitablesPrice(product.price)} / kg</p>
          <button type="button" className="fruitables-add-btn" onClick={handleAdd} disabled={!ready || adding}>
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

const TABS = [
  { id: "all", label: "All Products" },
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "pantry", label: "Pantry" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function filterProducts(products: DemoProduct[], tab: TabId): DemoProduct[] {
  switch (tab) {
    case "vegetables":
      return products.filter((p) => /vegetable|greens|herb|kale|carrot|tomato|lettuce/i.test(`${p.title} ${p.category}`));
    case "fruits":
      return products.filter((p) => /fruit|berry|apple|banana|mango|orange|strawberry/i.test(`${p.title} ${p.category}`));
    case "pantry":
      return products.filter((p) => /pantry|honey|egg|grain|oil/i.test(`${p.title} ${p.category}`));
    default:
      return products;
  }
}

export function FruitablesProductGrid({ tenant }: { tenant: DemoTenant }) {
  const [tab, setTab] = useState<TabId>("all");
  const filtered = useMemo(() => filterProducts(tenant.products, tab), [tenant.products, tab]);
  const display = filtered.length > 0 ? filtered : tenant.products;

  return (
    <section className="fruitables-section" id="products">
      <div className="fruitables-container-lg">
        <div className="fruitables-section-head">
          <h2>Our Organic Products</h2>
          <div className="fruitables-tabs">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`fruitables-tab ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {display.length === 0 ? (
          <p className="text-center">No products yet — check back soon.</p>
        ) : (
          <div className="fruitables-product-grid">
            {display.map((product) => (
              <FruitablesProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function FruitablesVegetableScroll({ tenant }: { tenant: DemoTenant }) {
  const vegetables = tenant.products.filter((p) =>
    /vegetable|greens|herb|kale|carrot|tomato|lettuce|salad/i.test(`${p.title} ${p.category}`)
  );
  const display = vegetables.length > 0 ? vegetables : tenant.products.slice(0, 6);

  return (
    <section className="fruitables-section" id="vegetables">
      <div className="fruitables-container-lg">
        <h2 className="mb-4 font-[family-name:var(--fb-heading)] text-3xl font-extrabold text-[var(--fb-dark)]">
          Fresh Organic Vegetables
        </h2>
        <div className="fruitables-scroll">
          {display.map((product) => (
            <FruitablesProductCard key={`veg-${product.id}`} tenantSlug={tenant.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
