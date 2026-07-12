"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function WaggyHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const brand = tenant.name.split(/\s+/)[0] ?? tenant.name;
  const phone = tenant.storeSettings.whatsapp.phone;

  return (
    <header>
      <div className="waggy-header-top">
        <div className="waggy-container-lg">
          <div className="waggy-header-grid">
            <Link href={homeHref} className="waggy-logo">
              {tenant.logoUrl ? (
                <Image src={tenant.logoUrl} alt={tenant.name} width={120} height={44} className="h-11 w-auto object-contain" />
              ) : (
                brand
              )}
            </Link>

            <div className="waggy-search hidden lg:flex">
              <Search className="h-5 w-5 shrink-0" aria-hidden />
              <input type="search" placeholder="Search pet food, toys, and accessories" aria-label="Search products" />
            </div>

            <div className="hidden gap-6 xl:flex">
              {phone && (
                <div className="waggy-support">
                  <span>Phone</span>
                  <strong>{phone}</strong>
                </div>
              )}
              <div className="waggy-support">
                <span>Location</span>
                <strong>{tenant.location}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="waggy-nav-bar">
        <div className="waggy-container-lg">
          <div className="waggy-nav-inner">
            <button
              type="button"
              className="waggy-mobile-toggle lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <nav className="waggy-nav" aria-label="Primary">
              <Link href={homeHref}>Home</Link>
              <a href="#categories">Categories</a>
              <a href="#products">Shop</a>
              <a href="#footer">Contact</a>
            </nav>

            <Link href={checkoutHref} className="waggy-cart-link">
              <ShoppingCart className="h-5 w-5" />
              Cart ({ready ? cartCount : 0})
              {ready && cartCount > 0 && <span className="waggy-cart-badge">{cartCount}</span>}
            </Link>
          </div>

          {menuOpen && (
            <nav className="waggy-mobile-menu lg:hidden" aria-label="Mobile">
              <Link href={homeHref} onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <a href="#products" onClick={() => setMenuOpen(false)}>
                Shop
              </a>
              <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
