"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Car,
  CarFront,
  Check,
  ChevronRight,
  Clock,
  Cog,
  Droplets,
  Globe,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Share2,
  ShoppingCart,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import {
  CARSERV_FEATURE_SERVICES,
  CARSERV_HERO_CAR,
  CARSERV_HERO_IMAGES,
  CARSERV_REPAIR_SERVICES,
  carservBrandName,
  carservPhone,
  formatCarservPrice,
} from "./carserv-utils";

const PRODUCT_TABS = [
  { id: "all", label: "All Items" },
  { id: "parts", label: "Parts" },
  { id: "services", label: "Services" },
  { id: "featured", label: "Featured" },
] as const;

type ProductTabId = (typeof PRODUCT_TABS)[number]["id"];

function featureIcon(name: "certificate" | "workers" | "tools") {
  switch (name) {
    case "certificate":
      return Award;
    case "workers":
      return Users;
    default:
      return Wrench;
  }
}

function serviceTabIcon(id: string) {
  switch (id) {
    case "engine":
      return Car;
    case "tires":
      return Cog;
    case "oil":
      return Droplets;
    default:
      return CarFront;
  }
}

function CarservProductCard({
  tenantSlug,
  product,
}: {
  tenantSlug: string;
  product: DemoProduct;
}) {
  const { addItem, ready } = useCart(tenantSlug);
  const [adding, setAdding] = useState(false);
  const productHref = `/${tenantSlug}/products/${product.slug}`;
  const badge = product.tags.includes("new")
    ? "New"
    : product.tags.includes("bestseller")
      ? "Popular"
      : null;

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
    <article className="cs-product-card">
      <div className="cs-product-image">
        <Link href={productHref}>
          <Image src={product.image} alt={product.title} width={320} height={240} />
        </Link>
        {badge && <span className="cs-product-badge">{badge}</span>}
      </div>
      <div className="cs-product-body">
        <div className="cs-product-cat">{product.category}</div>
        <Link href={productHref} className="cs-product-title">
          {product.title}
        </Link>
        <p className="cs-product-desc">{product.shortDescription}</p>
        <div className="cs-product-price">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <del>{formatCarservPrice(product.compareAtPrice)}</del>
          )}
          {formatCarservPrice(product.price)}
        </div>
      </div>
      <div className="cs-product-footer">
        <button type="button" className="cs-btn" onClick={handleAdd} disabled={!ready || adding}>
          {adding ? "Adding…" : "Add To Cart"}
        </button>
      </div>
    </article>
  );
}

export function CarservHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready, subtotal } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = carservBrandName(tenant.name);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const phone = carservPhone(tenant);

  return (
    <>
      <div className="cs-topbar">
        <div className="cs-container">
          <div className="cs-topbar-inner">
            <div className="cs-topbar-left">
              <span className="cs-topbar-item">
                <MapPin className="h-4 w-4" />
                {tenant.location}
              </span>
              <span className="cs-topbar-item">
                <Clock className="h-4 w-4" />
                Mon – Fri: 9:00 AM – 9:00 PM
              </span>
            </div>
            <div className="cs-topbar-right">
              {phone && (
                <span className="cs-topbar-item">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${phone}`}>{phone}</a>
                </span>
              )}
              <div className="cs-social-links" aria-label="Social links">
                <a href="#footer" className="cs-social-btn" aria-label="Share">
                  <Share2 className="h-4 w-4" />
                </a>
                <a href="#footer" className="cs-social-btn" aria-label="Website">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#footer" className="cs-social-btn" aria-label="Chat">
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a href="#footer" className="cs-social-btn" aria-label="Contact">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="cs-header">
        <div className="cs-container">
          <div className="cs-header-inner">
            <Link href={homeHref} className="cs-logo">
              <Car className="cs-logo-icon h-8 w-8" />
              {tenant.logoUrl ? tenant.name : brand}
            </Link>

            <nav className="cs-nav" aria-label="Main navigation">
              <Link href={homeHref} className="active">
                Home
              </Link>
              <a href="#services">Services</a>
              <a href="#products">Parts & Shop</a>
              <a href="#booking">Booking</a>
              <a href="#footer">Contact</a>
            </nav>

            <div className="cs-header-actions">
              <Link href={checkoutHref} className="cs-cart-btn" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {ready && cartCount > 0 && <span className="cs-cart-badge">{cartCount}</span>}
              </Link>
              <Link href={checkoutHref} className="cs-cart-total">
                {formatCarservPrice(subtotal)}
              </Link>
              {phone && (
                <a href={`tel:${phone}`} className="cs-phone-cta">
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              )}
              <a href="#booking" className="cs-btn hidden lg:inline-flex">
                Get A Quote
                <ChevronRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                className="cs-mobile-toggle"
                aria-label="Toggle menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="cs-mobile-menu lg:hidden">
              <Link href={homeHref} onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <a href="#services" onClick={() => setMenuOpen(false)}>
                Services
              </a>
              <a href="#products" onClick={() => setMenuOpen(false)}>
                Parts & Shop
              </a>
              <a href="#booking" onClick={() => setMenuOpen(false)}>
                Booking
              </a>
              <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
              {phone && (
                <a href={`tel:${phone}`} onClick={() => setMenuOpen(false)}>
                  Call {phone}
                </a>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export function CarservHero({ tenant }: { tenant: DemoTenant }) {
  const slides = useMemo(() => {
    const products = tenant.products.slice(0, 2);
    if (products.length === 0) {
      return [
        {
          kicker: "// Car Servicing //",
          title: tenant.tagline || "Qualified Car Repair Service Center",
          image: tenant.coverUrl ?? CARSERV_HERO_IMAGES[0]!,
          href: `/${tenant.slug}#booking`,
          cta: "Book A Service",
        },
      ];
    }
    return products.map((product, index) => ({
      kicker: "// Car Servicing //",
      title: product.title,
      image: product.image || CARSERV_HERO_IMAGES[index % CARSERV_HERO_IMAGES.length]!,
      href: `/${tenant.slug}/products/${product.slug}`,
      cta: index === 0 ? "Book A Service" : "Shop Parts",
    }));
  }, [tenant]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[active]!;

  return (
    <section className="cs-hero" aria-label="Hero">
      <div className="cs-hero-slide">
        <div className="cs-hero-bg">
          <Image src={slide.image} alt="" fill sizes="100vw" className="object-cover" priority />
          <div className="cs-hero-overlay" />
        </div>

        <div className="cs-container cs-hero-content">
          <div className="cs-hero-grid">
            <div>
              <p className="cs-hero-kicker">{slide.kicker}</p>
              <h1 className="cs-hero-title">{slide.title}</h1>
              <div className="cs-hero-actions">
                <Link href={slide.href} className="cs-btn">
                  {slide.cta}
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <a href="#services" className="cs-btn cs-btn-outline">
                  Our Services
                </a>
              </div>
            </div>
            <div className="cs-hero-car">
              <Image
                src={CARSERV_HERO_CAR}
                alt="Auto repair"
                width={480}
                height={280}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="cs-hero-dots" role="tablist" aria-label="Hero slides">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={active === index}
                className={`cs-hero-dot ${active === index ? "active" : ""}`}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CarservServices() {
  const [activeService, setActiveService] = useState(CARSERV_REPAIR_SERVICES[0]!.id);
  const current = CARSERV_REPAIR_SERVICES.find((s) => s.id === activeService) ?? CARSERV_REPAIR_SERVICES[0]!;

  return (
    <>
      <section className="cs-features" aria-label="Why choose us">
        <div className="cs-features-grid">
          {CARSERV_FEATURE_SERVICES.map(({ title, desc, icon, alt }) => {
            const Icon = featureIcon(icon);
            return (
              <div key={title} className={`cs-feature-card ${alt ? "alt" : ""}`}>
                <Icon className="cs-feature-icon h-12 w-12" />
                <div>
                  <h5>{title}</h5>
                  <p>{desc}</p>
                  <a href="#services" className="cs-feature-link">
                    Read More
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cs-services-section" id="services">
        <div className="cs-container">
          <div className="cs-section-head">
            <p className="cs-section-kicker">// Our Services //</p>
            <h2 className="cs-section-title">Explore Our Services</h2>
          </div>

          <div className="cs-services-layout">
            <div className="cs-service-tabs" role="tablist">
              {CARSERV_REPAIR_SERVICES.map((service) => {
                const Icon = serviceTabIcon(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    role="tab"
                    aria-selected={activeService === service.id}
                    className={`cs-service-tab ${activeService === service.id ? "active" : ""}`}
                    onClick={() => setActiveService(service.id)}
                  >
                    <Icon className="h-8 w-8" />
                    <h4>{service.label}</h4>
                  </button>
                );
              })}
            </div>

            <div className="cs-service-panel" role="tabpanel">
              <Image src={current.image} alt={current.label} width={500} height={350} />
              <div>
                <h3>15 Years Of Experience In Auto Servicing</h3>
                <p className="text-[var(--cs-muted)]">
                  From diagnostics to full engine rebuilds, our certified technicians deliver reliable
                  repairs with transparent pricing and fast turnaround.
                </p>
                <ul className="cs-check-list">
                  <li>
                    <Check className="h-4 w-4" />
                    Quality Servicing
                  </li>
                  <li>
                    <Check className="h-4 w-4" />
                    Expert Workers
                  </li>
                  <li>
                    <Check className="h-4 w-4" />
                    Modern Equipment
                  </li>
                </ul>
                <a href="#booking" className="cs-btn mt-4 inline-flex">
                  Book {current.label}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function CarservProducts({ tenant }: { tenant: DemoTenant }) {
  const [tab, setTab] = useState<ProductTabId>("all");

  const filtered = useMemo(() => {
    switch (tab) {
      case "parts":
        return tenant.products.filter(
          (p) =>
            /part|tire|oil|filter|brake|battery|fluid/i.test(p.category) ||
            /part|tire|oil|filter|brake|battery/i.test(p.title),
        );
      case "services":
        return tenant.products.filter(
          (p) =>
            /service|repair|maintenance|wash|diagnostic/i.test(p.category) ||
            /service|repair|maintenance/i.test(p.title),
        );
      case "featured":
        return tenant.products.filter(
          (p) => p.tags.includes("bestseller") || (p.compareAtPrice && p.compareAtPrice > p.price),
        );
      default:
        return tenant.products;
    }
  }, [tenant.products, tab]);

  const display = filtered.length > 0 ? filtered : tenant.products;

  return (
    <section className="cs-products-section" id="products">
      <div className="cs-container">
        <div className="cs-products-head">
          <div>
            <p className="cs-section-kicker">// Parts & Services //</p>
            <h2 className="cs-section-title">Shop Parts & Service Packages</h2>
          </div>
          <div className="cs-tabs" role="tablist">
            {PRODUCT_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`cs-tab ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {display.length === 0 ? (
          <p className="text-center text-[var(--cs-muted)]">No products yet — check back soon.</p>
        ) : (
          <div className="cs-product-grid">
            {display.map((product) => (
              <CarservProductCard key={product.id} tenantSlug={tenant.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CarservBooking({ tenant }: { tenant: DemoTenant }) {
  const phone = carservPhone(tenant);
  const serviceOptions = useMemo(() => {
    const fromProducts = [...new Set(tenant.products.map((p) => p.category))];
    const defaults = CARSERV_REPAIR_SERVICES.map((s) => s.label);
    return [...new Set([...defaults, ...fromProducts])];
  }, [tenant.products]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    form.reset();
  }

  return (
    <section className="cs-booking" id="booking">
      <div className="cs-container">
        <div className="cs-booking-grid">
          <div className="cs-booking-copy">
            <h2>Certified and Award Winning Car Repair Service Provider</h2>
            <p>
              {tenant.tagline ||
                "Book your next service online or call our shop for a fast quote. We handle everything from routine maintenance to major repairs."}
            </p>
            {phone && (
              <a href={`tel:${phone}`} className="cs-footer-phone mt-6 inline-flex">
                <Phone className="h-5 w-5" />
                Call {phone}
              </a>
            )}
          </div>

          <div className="cs-booking-form-wrap">
            <h2>Book For A Service</h2>
            <form className="cs-booking-form" onSubmit={handleSubmit}>
              <div className="cs-form-row">
                <input type="text" name="name" placeholder="Your Name" required />
                <input type="email" name="email" placeholder="Your Email" required />
              </div>
              <div className="cs-form-row">
                <select name="service" required defaultValue="">
                  <option value="" disabled>
                    Select A Service
                  </option>
                  {serviceOptions.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                <input type="date" name="date" required />
              </div>
              <textarea name="request" placeholder="Special Request" rows={3} />
              <button type="submit" className="cs-btn cs-btn-accent w-full">
                Book Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CarservFooter({ tenant }: { tenant: DemoTenant }) {
  const brand = carservBrandName(tenant.name);
  const phone = carservPhone(tenant);
  const email = `${tenant.slug.replace(/-/g, "")}@gumacommerce.app`;
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;

  const serviceLinks = CARSERV_REPAIR_SERVICES.map((s) => s.label);

  return (
    <footer className="cs-footer" id="footer">
      <div className="cs-container">
        <div className="cs-footer-grid">
          <div>
            <h4>Address</h4>
            <div className="cs-footer-item">
              <MapPin className="h-4 w-4" />
              <p>{tenant.location}</p>
            </div>
            {phone && (
              <div className="cs-footer-item">
                <Phone className="h-4 w-4" />
                <p>
                  <a href={`tel:${phone}`}>{phone}</a>
                </p>
              </div>
            )}
            <div className="cs-footer-item">
              <Mail className="h-4 w-4" />
              <p>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>
            <div className="cs-footer-social">
              <a href="#footer" aria-label="Share">
                <Share2 className="h-4 w-4" />
              </a>
              <a href="#footer" aria-label="Website">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#footer" aria-label="Chat">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4>Opening Hours</h4>
            <p>
              <strong className="text-white">Monday – Friday:</strong>
              <br />
              9:00 AM – 9:00 PM
            </p>
            <p>
              <strong className="text-white">Saturday – Sunday:</strong>
              <br />
              9:00 AM – 12:00 PM
            </p>
          </div>

          <div>
            <h4>Services</h4>
            <ul className="cs-footer-links">
              {serviceLinks.map((label) => (
                <li key={label}>
                  <a href="#services">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul className="cs-footer-links">
              <li>
                <Link href={homeHref}>Home</Link>
              </li>
              <li>
                <a href="#products">Parts & Shop</a>
              </li>
              <li>
                <a href="#booking">Book A Service</a>
              </li>
              <li>
                <Link href={checkoutHref}>Cart & Checkout</Link>
              </li>
            </ul>
            {phone && (
              <a href={`tel:${phone}`} className="cs-footer-phone">
                <Phone className="h-5 w-5" />
                {phone}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="cs-footer-bar">
        <div className="cs-container">
          &copy; {new Date().getFullYear()} {tenant.name || brand}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
