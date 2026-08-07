"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import {
  formatSpecialtyPrice,
  resolveFlagshipProduct,
  resolveSecondaryProducts,
  specialtyPhone,
} from "./specialty-utils";

export function SpecialtyHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;

  return (
    <header className="sp-header">
      <div className="sp-container sp-header-inner">
        <Link href={homeHref} className="sp-logo">
          {tenant.logoUrl ? (
            <Image src={tenant.logoUrl} alt={tenant.name} width={120} height={36} className="h-9 w-auto object-contain" />
          ) : (
            tenant.name
          )}
        </Link>
        <nav className="sp-nav" aria-label="Primary">
          <a href="#offer">The offer</a>
          {tenant.products.length > 1 && <a href="#more">More options</a>}
          <a href="#about">About</a>
          <a href="#footer">Contact</a>
        </nav>
        <Link href={checkoutHref} className="sp-cart">
          <ShoppingBag className="h-4 w-4" />
          Cart ({ready ? cartCount : 0})
        </Link>
      </div>
    </header>
  );
}

function FlagshipActions({
  tenantSlug,
  product,
  ctaLabel,
}: {
  tenantSlug: string;
  product: DemoProduct;
  ctaLabel: string;
}) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;

  async function handleAdd() {
    setAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 180));
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
    <div className="sp-actions">
      <button type="button" className="sp-btn" onClick={handleAdd} disabled={!ready || adding}>
        {adding ? "Adding…" : ctaLabel}
      </button>
      <Link href={productHref} className="sp-btn sp-btn-ghost">
        Full details
      </Link>
    </div>
  );
}

export function SpecialtyHero({ tenant }: { tenant: DemoTenant }) {
  const flagship = resolveFlagshipProduct(tenant.products);
  const phone = specialtyPhone(tenant);
  const isService = /service|repair|booking|session|consult|install|maintenance/i.test(
    `${tenant.category} ${flagship?.title ?? ""} ${flagship?.category ?? ""}`
  );
  const ctaLabel = isService ? "Book this offer" : "Add to cart";

  if (!flagship) {
    return (
      <section className="sp-hero" id="offer">
        <div className="sp-container sp-empty">
          <h1>{tenant.name}</h1>
          <p className="sp-hero-lead">{tenant.tagline}</p>
          <p>Publish your main product or service to spotlight it here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="sp-hero" id="offer">
      <div className="sp-container sp-hero-grid">
        <div>
          <p className="sp-kicker">
            <Star className="h-3.5 w-3.5" />
            Signature offer
          </p>
          <h1>{flagship.title}</h1>
          <p className="sp-hero-lead">
            {flagship.shortDescription || tenant.shopTheme.promoSubtitle || tenant.tagline}
          </p>
          <div className="sp-price-row">
            <span className="sp-price">{formatSpecialtyPrice(flagship.price)}</span>
            {flagship.compareAtPrice && flagship.compareAtPrice > flagship.price && (
              <span className="sp-compare">{formatSpecialtyPrice(flagship.compareAtPrice)}</span>
            )}
          </div>
          <FlagshipActions tenantSlug={tenant.slug} product={flagship} ctaLabel={ctaLabel} />
          <div className="sp-meta">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {tenant.location}
            </span>
            {phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {phone}
              </span>
            )}
          </div>
        </div>
        <div className="sp-visual">
          <Image src={flagship.image} alt={flagship.title} fill sizes="(max-width: 960px) 100vw, 520px" priority />
          <span className="sp-visual-badge">{isService ? "Service" : "Specialty"}</span>
        </div>
      </div>
    </section>
  );
}

function SecondaryCard({ tenantSlug, product }: { tenantSlug: string; product: DemoProduct }) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;

  async function handleAdd() {
    setAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 160));
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
    <article className="sp-card">
      <div className="sp-card-image">
        <Image src={product.image} alt={product.title} fill sizes="240px" />
      </div>
      <h3>
        <Link href={productHref}>{product.title}</Link>
      </h3>
      <p>{product.shortDescription}</p>
      <div className="sp-card-price">{formatSpecialtyPrice(product.price)}</div>
      <button type="button" className="sp-btn" onClick={handleAdd} disabled={!ready || adding}>
        {adding ? "Adding…" : "Add"}
      </button>
    </article>
  );
}

export function SpecialtySecondary({ tenant }: { tenant: DemoTenant }) {
  const flagship = resolveFlagshipProduct(tenant.products);
  const secondary = resolveSecondaryProducts(tenant.products, flagship?.id);
  if (!secondary.length) return null;

  return (
    <section className="sp-section" id="more">
      <div className="sp-container">
        <h2 className="sp-section-title">Also available</h2>
        <p className="sp-section-lead">Related options — kept secondary so your specialty stays the focus.</p>
        <div className="sp-secondary-grid">
          {secondary.map((product) => (
            <SecondaryCard key={product.id} tenantSlug={tenant.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SpecialtyAbout({ tenant }: { tenant: DemoTenant }) {
  return (
    <section className="sp-section" id="about">
      <div className="sp-container">
        <div className="sp-about">
          <div>
            <h2 className="sp-section-title">About {tenant.name}</h2>
            <p className="sp-section-lead">{tenant.tagline}</p>
            <p className="sp-section-lead">
              Built for specialty sellers — one hero offer first, with optional supporting products or service
              packages underneath.
            </p>
          </div>
          <div>
            <h2 className="sp-section-title">Why this layout</h2>
            <p className="sp-section-lead">
              Ideal for repair shops, signature services, limited drops, or any business that converts on a single
              clear offer instead of a dense catalog.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SpecialtyFooter({ tenant }: { tenant: DemoTenant }) {
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const phone = specialtyPhone(tenant);
  const year = new Date().getFullYear();

  return (
    <footer className="sp-footer" id="footer">
      <div className="sp-container">
        <div className="sp-footer-grid">
          <div>
            <h5>{tenant.name}</h5>
            <p>{tenant.tagline}</p>
            <p className="mt-3">{tenant.location}</p>
            {phone && <p className="mt-2">{phone}</p>}
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li>
                <Link href={homeHref}>Home</Link>
              </li>
              <li>
                <a href="#offer">The offer</a>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>Order</h5>
            <ul>
              <li>
                <Link href={checkoutHref}>Checkout</Link>
              </li>
              <li>
                <a href="#footer">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="sp-footer-bottom">
          <p>
            © {tenant.name} {year}. All rights reserved.
          </p>
          <p>Powered by Guma One</p>
        </div>
      </div>
    </footer>
  );
}
