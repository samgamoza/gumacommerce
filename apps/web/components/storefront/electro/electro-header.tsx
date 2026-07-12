"use client";

import Link from "next/link";
import { Menu, Phone, Search, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { electroBrandName, formatElectroPrice } from "./electro-utils";

export function ElectroHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready, subtotal } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const brand = electroBrandName(tenant.name);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;

  const categories = useMemo(() => {
    if (tenant.shopCategories.length > 0) return tenant.shopCategories;
    const names = [...new Set(tenant.products.map((p) => p.category))];
    return names.map((name, i) => ({ id: `cat-${i}`, name, slug: name.toLowerCase().replace(/\s+/g, "-") }));
  }, [tenant]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    tenant.products.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + 1));
    return map;
  }, [tenant.products]);

  return (
    <>
      <div className="electro-topbar">
        <div className="electro-container">
          <div className="electro-topbar-inner">
            <div>
              <a href="#footer">Help</a>
              <small> / </small>
              <a href="#footer">Support</a>
              <small> / </small>
              <a href="#footer">Contact</a>
            </div>
            <div className="text-center">
              {phone && (
                <>
                  <small>Call Us: </small>
                  <a href={`tel:${phone}`}>{phone}</a>
                </>
              )}
            </div>
            <div className="text-right">{tenant.location}</div>
          </div>
        </div>
      </div>

      <div className="electro-container electro-header-row">
        <Link href={homeHref} className="electro-logo">
          <ShoppingBag className="electro-logo-icon h-8 w-8" />
          {tenant.logoUrl ? tenant.name : brand}
        </Link>

        <form className="electro-search" onSubmit={(e) => e.preventDefault()} role="search">
          <input type="search" placeholder="Search products…" aria-label="Search products" />
          <select aria-label="Category filter" defaultValue="all">
            <option value="all">All Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <button type="submit" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
        </form>

        <div className="electro-header-cart">
          <Link href={checkoutHref} className="electro-icon-btn" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {ready && cartCount > 0 && <span className="electro-cart-badge">{cartCount}</span>}
          </Link>
          <Link href={checkoutHref} className="electro-cart-total">
            {formatElectroPrice(subtotal)}
          </Link>
        </div>
      </div>

      <div className="electro-nav-bar">
        <div className="electro-container electro-nav-inner">
          <div className="electro-categories">
            <button type="button" className="electro-categories-toggle" onClick={() => setCatsOpen((o) => !o)}>
              <Menu className="h-5 w-5" />
              All Categories
            </button>
            {catsOpen && (
              <ul className="electro-categories-menu">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <a href="#products" onClick={() => setCatsOpen(false)}>
                      {cat.name}
                      <span>({categoryCounts.get(cat.name) ?? 0})</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav className="electro-main-nav">
            <button
              type="button"
              className="electro-mobile-toggle lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="electro-main-nav-links">
              <Link href={homeHref}>Home</Link>
              <a href="#products">Shop</a>
              <a href="#footer">Contact</a>
            </div>
            {phone && (
              <a href={`tel:${phone}`} className="electro-phone-cta">
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
          </nav>
        </div>

        {menuOpen && (
          <div className="electro-mobile-menu lg:hidden">
            <Link href={homeHref} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <a href="#products" onClick={() => setMenuOpen(false)}>
              Shop
            </a>
            <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
              Cart ({cartCount})
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
