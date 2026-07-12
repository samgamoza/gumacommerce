"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatMinistorePrice } from "./ministore-utils";

function MinistoreProductCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
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
    <article className="ministore-product-card">
      <div className="ministore-product-img">
        <Link href={productHref}>
          <Image src={product.image} alt={product.title} fill sizes="260px" />
        </Link>
        <div className="ministore-product-overlay">
          <button type="button" className="ministore-add-btn" onClick={handleAdd} disabled={!ready || adding}>
            <ShoppingCart className="h-4 w-4" aria-hidden />
            {adding ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </div>
      <div className="ministore-product-meta">
        <h3>
          <Link href={productHref}>{product.title}</Link>
        </h3>
        <span className="ministore-product-price">{formatMinistorePrice(product.price)}</span>
      </div>
    </article>
  );
}

function ProductRow({
  tenant,
  id,
  title,
  filter,
  shopAnchor,
}: {
  tenant: DemoTenant;
  id: string;
  title: string;
  filter: (product: DemoProduct) => boolean;
  shopAnchor: string;
}) {
  const products = useMemo(() => {
    const filtered = tenant.products.filter(filter);
    return filtered.length > 0 ? filtered : tenant.products.slice(0, 5);
  }, [tenant.products, filter]);

  const shopHref = `/${tenant.slug}${shopAnchor}`;

  return (
    <section className="ministore-section" id={id}>
      <div className="ministore-container-lg">
        <div className="ministore-section-head">
          <h2>{title}</h2>
          <Link href={shopHref} className="ministore-btn-outline">
            Go to Shop
          </Link>
        </div>
        <div className="ministore-scroll">
          {products.map((product) => (
            <MinistoreProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function MinistoreMobileProducts({ tenant }: { tenant: DemoTenant }) {
  return (
    <ProductRow
      tenant={tenant}
      id="mobile-products"
      title="Mobile Products"
      shopAnchor="#mobile-products"
      filter={(p) => /phone|mobile|tablet|iphone|galaxy|pixel|laptop|macbook/i.test(`${p.title} ${p.category}`)}
    />
  );
}

export function MinistoreWatches({ tenant }: { tenant: DemoTenant }) {
  return (
    <ProductRow
      tenant={tenant}
      id="watches"
      title="Smart Watches"
      shopAnchor="#watches"
      filter={(p) => /watch|wearable|band/i.test(`${p.title} ${p.category}`)}
    />
  );
}
