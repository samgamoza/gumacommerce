"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Fan,
  Flame,
  Globe,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  Wind,
  Wrench,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { productCardCtaLabel, productCardPricing } from "@/lib/product-price-display";
import { adminUrl, shopPublicUrl, shopPublicUrlLabel } from "@/lib/utils";
import {
  AIRCON_ABOUT_IMAGES,
  AIRCON_HERO_SLIDES,
  AIRCON_REASONS,
  AIRCON_SERVICE_CATEGORIES,
  AIRCON_STATS,
  airconBrandName,
  formatPhpPrice,
} from "./aircon-utils";

const SERVICE_ICONS = [Fan, Snowflake, Flame, Wrench, Wind, ClipboardCheck] as const;
const REASON_ICONS = [ShieldCheck, Award, Clock] as const;

function tenantPhone(tenant: DemoTenant): string | null {
  return tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
    ? tenant.storeSettings.whatsapp.phone
    : null;
}

export function AirconHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = airconBrandName(tenant.name);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const phone = tenantPhone(tenant);
  const siteUrl = shopPublicUrl(tenant.slug);
  const siteLabel = shopPublicUrlLabel(tenant.slug);

  const navLinks = [
    { href: homeHref, label: "Home", isLink: true },
    { href: "#about", label: "About Us", isLink: false },
    { href: "#services", label: "Our Services", isLink: false },
    { href: "#packages", label: "Service Packages", isLink: false },
    { href: "#quote", label: "Free Quote", isLink: false },
    { href: "#footer", label: "Contact Us", isLink: false },
  ] as const;

  return (
    <>
      <div className="ac-topbar">
        <div className="ac-container ac-topbar-inner">
          <div className="ac-topbar-contact">
            {phone && (
              <span>
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </span>
            )}
            <span>
              <Globe className="h-3.5 w-3.5" />
              <a href={siteUrl}>{siteLabel}</a>
            </span>
          </div>
          <div className="ac-topbar-links">
            <a href={homeHref}>Home</a>
            <span>/</span>
            <a href="#footer">Terms</a>
            <span>/</span>
            <a href="#footer">Support</a>
          </div>
        </div>
      </div>

      <header className="ac-navbar">
        <div className="ac-container ac-nav-inner">
          <Link href={homeHref} className="ac-brand">
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} alt={tenant.name} width={44} height={44} className="rounded-full object-cover" />
            ) : (
              <span className="ac-brand-icon">
                <Wind className="h-5 w-5" />
              </span>
            )}
            {brand}
          </Link>

          <nav className="ac-nav-links" aria-label="Main navigation">
            {navLinks.map((link) =>
              link.isLink ? (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="ac-nav-actions">
            <Link href={checkoutHref} className="ac-cart-btn" aria-label="Booking cart">
              <ShoppingCart className="h-5 w-5" />
              {ready && cartCount > 0 && <span className="ac-cart-badge">{cartCount}</span>}
            </Link>
            <button
              type="button"
              className="ac-menu-toggle"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="ac-mobile-menu lg:hidden">
            {navLinks.map((link) =>
              link.isLink ? (
                <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              )
            )}
            <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
              Cart ({cartCount})
            </Link>
          </div>
        )}
      </header>
    </>
  );
}

export function AirconHero({ tenant }: { tenant: DemoTenant }) {
  const slides = useMemo(() => {
    if (tenant.coverUrl) {
      return [
        {
          title: tenant.shopTheme.promoTitle ?? AIRCON_HERO_SLIDES[0].title,
          subtitle: tenant.tagline || tenant.shopTheme.tagline || AIRCON_HERO_SLIDES[0].subtitle,
          image: tenant.coverUrl,
        },
        ...AIRCON_HERO_SLIDES.slice(1),
      ];
    }
    return [...AIRCON_HERO_SLIDES];
  }, [tenant]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[active]!;

  return (
    <section className="ac-hero" aria-label="Hero">
      {slides.map((item, index) => (
        <div key={item.title} className={`ac-hero-slide ${index === active ? "active" : ""}`}>
          <Image src={item.image} alt={item.title} fill priority={index === 0} sizes="100vw" className="object-cover" />
        </div>
      ))}

      <div className="ac-hero-overlay">
        <div className="ac-hero-content">
          <h1 className="ac-hero-title">{slide.title}</h1>
          <p className="ac-hero-subtitle">{slide.subtitle}</p>
          <a href="#services" className="ac-btn">
            Explore Services
          </a>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="ac-hero-controls ac-hero-prev"
            aria-label="Previous slide"
            onClick={() => setActive((current) => (current - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="ac-hero-controls ac-hero-next"
            aria-label="Next slide"
            onClick={() => setActive((current) => (current + 1) % slides.length)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="ac-hero-dots">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={`ac-hero-dot ${index === active ? "active" : ""}`}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function AirconAbout({ tenant }: { tenant: DemoTenant }) {
  const phone = tenantPhone(tenant);
  const siteUrl = shopPublicUrl(tenant.slug);
  const siteLabel = shopPublicUrlLabel(tenant.slug);

  return (
    <>
      <section className="ac-section" id="about">
        <div className="ac-container">
          <div className="ac-about-grid">
            <div>
              <p className="ac-section-kicker">About {airconBrandName(tenant.name)}</p>
              <h2 className="ac-section-title">
                Welcome To Best Cooling &amp; Heating Service Center
              </h2>
              <div className="ac-about-features">
                <div className="ac-about-feature">
                  <span className="ac-about-feature-icon">
                    <Wrench className="h-4 w-4" />
                  </span>
                  Expert Technician
                </div>
                <div className="ac-about-feature">
                  <span className="ac-about-feature-icon">
                    <Award className="h-4 w-4" />
                  </span>
                  Best Quality Services
                </div>
              </div>
              <p className="ac-text-muted">
                {tenant.tagline ||
                  "Professional HVAC installation, repair, and maintenance for homes and businesses. Same-day service available across Metro Manila."}
              </p>
              <div className="ac-about-contact">
                {phone && (
                  <div className="ac-about-contact-item">
                    <span className="ac-about-contact-icon">
                      <Phone className="h-5 w-5" />
                    </span>
                    <a href={`tel:${phone}`}>{phone}</a>
                  </div>
                )}
                <div className="ac-about-contact-item">
                  <span className="ac-about-contact-icon">
                    <Globe className="h-5 w-5" />
                  </span>
                  <a href={siteUrl} target="_blank" rel="noreferrer">
                    {siteLabel}
                  </a>
                </div>
              </div>
            </div>

            <div className="ac-about-gallery">
              <div>
                <Image
                  src={AIRCON_ABOUT_IMAGES[0]}
                  alt="HVAC technician at work"
                  width={400}
                  height={300}
                  className="ac-gallery-offset"
                />
              </div>
              <div>
                <Image src={AIRCON_ABOUT_IMAGES[1]} alt="Air conditioning unit" width={500} height={360} />
              </div>
              <div className="text-right">
                <Image src={AIRCON_ABOUT_IMAGES[2]} alt="AC maintenance" width={280} height={220} />
              </div>
              <div>
                <Image src={AIRCON_ABOUT_IMAGES[3]} alt="Cooling service" width={400} height={300} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ac-stats" aria-label="Company statistics">
        <div className="ac-container">
          <div className="ac-stats-grid">
            {AIRCON_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="ac-stat-value">{stat.value}</div>
                <div className="ac-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ac-section">
        <div className="ac-container">
          <div className="ac-reasons-grid">
            <div>
              <h2 className="ac-section-title">Few Reasons Why People Choosing Us!</h2>
              <p className="ac-text-muted mb-5">
                Trusted by thousands of homeowners and facility managers for reliable cooling, heating, and air quality
                solutions — backed by certified technicians and honest pricing.
              </p>
              {AIRCON_REASONS.map((reason, index) => {
                const Icon = REASON_ICONS[index] ?? ShieldCheck;
                return (
                  <div key={reason.title} className="ac-reason-item">
                    <span className="ac-reason-icon">
                      <Icon className="h-8 w-8" />
                    </span>
                    <div>
                      <h5>{reason.title}</h5>
                      <p>{reason.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ac-reasons-image">
              <Image
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900&q=80"
                alt="Professional HVAC service"
                fill
                sizes="(max-width: 992px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function AirconServices() {
  return (
    <section className="ac-section" id="services">
      <div className="ac-container">
        <div className="ac-services-head">
          <p className="ac-section-kicker">What We Do</p>
          <h2 className="ac-section-title">We Provide Professional Heating &amp; Cooling Services</h2>
        </div>
        <div className="ac-services-grid">
          {AIRCON_SERVICE_CATEGORIES.map((service, index) => {
            const Icon = SERVICE_ICONS[index] ?? Fan;
            return (
              <article key={service.title} className="ac-service-card">
                <Image src={service.image} alt={service.title} width={400} height={200} />
                <div className="ac-service-card-bar">
                  <span className="ac-service-card-icon">
                    <Icon className="h-7 w-7" />
                  </span>
                  <a href="#packages" className="ac-service-card-title">
                    {service.title}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AirconProductCard({
  tenantSlug,
  product,
  category,
}: {
  tenantSlug: string;
  product: DemoProduct;
  category?: string | null;
}) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;
  const pricing = productCardPricing(category, product, formatPhpPrice);
  const badge = product.tags.includes("bestseller")
    ? "Popular"
    : product.tags.includes("new")
      ? "New"
      : pricing.kind === "service"
        ? "Service"
        : null;

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
    <article className="ac-product-card">
      <div className="ac-product-image-wrap">
        <Link href={productHref}>
          <Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 100vw, 280px" />
        </Link>
        {badge && <span className="ac-product-badge">{badge}</span>}
      </div>
      <div className="ac-product-body">
        <Link href={productHref} className="ac-product-category">
          {product.category}
        </Link>
        <Link href={productHref} className="ac-product-title">
          {product.title}
        </Link>
        <p className="ac-product-desc">{product.shortDescription}</p>
        {pricing.compareAtLine && (
          <del className="ac-product-price-old">{pricing.compareAtLine}</del>
        )}
        <span className="ac-product-price">{pricing.priceLine}</span>
        {pricing.priceCaption && pricing.kind === "service" && (
          <p className="ac-text-muted mt-1 text-xs">{pricing.priceCaption}</p>
        )}
      </div>
      <div className="ac-product-footer">
        <button type="button" className="ac-btn ac-btn-sm" onClick={handleBook} disabled={!ready || adding}>
          {adding ? "Booking…" : productCardCtaLabel(category)}
        </button>
        <Link href={productHref} className="ac-btn ac-btn-outline ac-btn-sm">
          Details
        </Link>
      </div>
    </article>
  );
}

export function AirconProducts({ tenant }: { tenant: DemoTenant }) {
  const products = tenant.products;

  return (
    <section className="ac-section ac-products-section" id="packages">
      <div className="ac-container">
        <div className="ac-products-head">
          <p className="ac-section-kicker">Book Online</p>
          <h2 className="ac-section-title">Service Packages &amp; Maintenance Plans</h2>
          <p className="ac-text-muted">
            Choose a package, add it to your booking cart, and checkout — we&apos;ll confirm your appointment right away.
          </p>
        </div>

        {products.length === 0 ? (
          <p className="text-center ac-text-muted">No service packages yet — check back soon.</p>
        ) : (
          <div className="ac-product-grid">
            {products.map((product) => (
              <AirconProductCard
                key={product.id}
                tenantSlug={tenant.slug}
                product={product}
                category={tenant.category}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function AirconQuote({ tenant }: { tenant: DemoTenant }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="ac-quote" id="quote">
      <div className="ac-quote-row">
        <div className="ac-quote-text">
          <h2 className="ac-section-title text-white">For Individuals And Organisations</h2>
          <p>
            Need a custom HVAC solution? Tell us about your space and we&apos;ll prepare a free, no-obligation quote for
            installation, repair, or annual maintenance.
          </p>
          <a href="#services" className="ac-btn">
            View Our Services
          </a>
        </div>

        <div className="ac-quote-form-wrap">
          <form className="ac-quote-form" onSubmit={handleSubmit}>
            <h3 className="ac-section-title" style={{ fontSize: "1.35rem" }}>
              Get A Free Quote
            </h3>
            <div className="ac-quote-form-grid">
              <div className="ac-field">
                <label htmlFor="ac-name">Your Name</label>
                <input id="ac-name" name="name" type="text" placeholder="Juan Dela Cruz" required />
              </div>
              <div className="ac-field">
                <label htmlFor="ac-email">Your Email</label>
                <input id="ac-email" name="email" type="email" placeholder="you@email.com" required />
              </div>
              <div className="ac-field">
                <label htmlFor="ac-phone">Your Mobile</label>
                <input id="ac-phone" name="phone" type="tel" placeholder="+63 9XX XXX XXXX" required />
              </div>
              <div className="ac-field">
                <label htmlFor="ac-service">Service Type</label>
                <select id="ac-service" name="service" defaultValue="repair" required>
                  <option value="installation">AC Installation</option>
                  <option value="repair">Maintenance &amp; Repair</option>
                  <option value="cooling">Cooling Services</option>
                  <option value="heating">Heating Services</option>
                  <option value="inspection">Annual Inspection</option>
                </select>
              </div>
              <div className="ac-field ac-field-full">
                <label htmlFor="ac-message">Message</label>
                <textarea id="ac-message" name="message" rows={4} placeholder="Describe your AC issue or project…" />
              </div>
              <div className="ac-field-full">
                <button type="submit" className="ac-btn">
                  Get A Free Quote
                </button>
                {submitted && (
                  <p className="ac-text-muted mt-3" style={{ fontSize: "0.875rem" }}>
                    Thanks, {tenant.name} will reach out shortly. Browse our services below.
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export function AirconFooter({ tenant }: { tenant: DemoTenant }) {
  const phone = tenantPhone(tenant);
  const siteUrl = shopPublicUrl(tenant.slug);
  const siteLabel = shopPublicUrlLabel(tenant.slug);
  const brand = airconBrandName(tenant.name);
  const homeHref = `/${tenant.slug}`;

  return (
    <footer className="ac-footer" id="footer">
      <div className="ac-container">
        <div className="ac-footer-grid">
          <div>
            <div className="ac-footer-brand">
              <Wind className="h-7 w-7 text-[var(--ac-primary)]" />
              {brand}
            </div>
            <p>
              {tenant.tagline ||
                "Your trusted partner for air conditioning installation, repair, and maintenance across the Philippines."}
            </p>
          </div>

          <div>
            <h5>Get In Touch</h5>
            <div className="ac-footer-contact">
              {tenant.location && (
                <p>
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--ac-primary)]" />
                  {tenant.location}
                </p>
              )}
              {phone && (
                <p>
                  <Phone className="h-4 w-4 shrink-0 text-[var(--ac-primary)]" />
                  <a href={`tel:${phone}`}>{phone}</a>
                </p>
              )}
              <p>
                <Globe className="h-4 w-4 shrink-0 text-[var(--ac-primary)]" />
                <a href={siteUrl} target="_blank" rel="noreferrer">
                  {siteLabel}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h5>Our Services</h5>
            <ul className="ac-footer-links">
              {AIRCON_SERVICE_CATEGORIES.map((service) => (
                <li key={service.title}>
                  <a href="#services">{service.title}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Quick Links</h5>
            <ul className="ac-footer-links">
              <li>
                <Link href={homeHref}>Home</Link>
              </li>
              <li>
                <a href="#packages">Service Packages</a>
              </li>
              <li>
                <a href="#quote">Free Quote</a>
              </li>
              <li>
                <Link href={`/${tenant.slug}/checkout`}>Checkout</Link>
              </li>
              <li>
                <a href={adminUrl} target="_blank" rel="noreferrer">
                  Seller Dashboard
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="ac-footer-bar">
        <div className="ac-container">
          &copy; {new Date().getFullYear()}{" "}
          <a href={homeHref}>{tenant.name}</a>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
