"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatMellowPrice } from "./mellow-utils";

function MellowRoomCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;

  async function handleBook() {
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
    <article>
      <div className="mellow-room-card">
        <div className="mellow-room-img">
          <Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="mellow-room-overlay">
            <h4>{product.title}</h4>
            <p>{product.shortDescription}</p>
            <div className="mellow-room-actions">
              <button type="button" className="mellow-add-btn" onClick={handleBook} disabled={!ready || adding}>
                {adding ? "Adding…" : "Book Now"}
              </button>
              <Link href={productHref} className="mellow-view-btn">
                View
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mellow-room-meta">
        <h4>
          <Link href={productHref}>{product.title}</Link>
        </h4>
        <p className="mellow-room-price">
          {formatMellowPrice(product.price)}
          <span> /night</span>
        </p>
      </div>
    </article>
  );
}

export function MellowRooms({ tenant }: { tenant: DemoTenant }) {
  const products = tenant.products.slice(0, 6);

  return (
    <section className="mellow-section bg-[var(--ml-secondary)]" id="rooms">
      <div className="mellow-container-fluid">
        <div className="mellow-rooms-head">
          <h2 className="mellow-section-title !mb-0 !text-left">Explore our rooms</h2>
          <Link href={`/${tenant.slug}#rooms`} className="mellow-btn">
            Explore rooms
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-[var(--ml-muted)]">No rooms listed yet — check back soon.</p>
        ) : (
          <div className="mellow-room-grid">
            {products.map((product) => (
              <MellowRoomCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
