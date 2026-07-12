"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function StylishHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const brand = tenant.name.split(/\s+/)[0] ?? tenant.name;

  return (
    <header className="stylish-header">
      <div className="stylish-topbar">
        <div className="stylish-container">
          <div className="stylish-topbar-inner">
            <div className="hidden md:block" aria-hidden />
            <p className="stylish-topbar-promo">
              <strong>Special Offer</strong>: {tenant.shopTheme.promoSubtitle}
            </p>
            <ul className="stylish-topbar-links">
              <li>
                <a href="#footer">Contact</a>
              </li>
              <li>
                <Link href={checkoutHref}>Cart</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="stylish-container">
        <div className="stylish-nav-inner">
          <Link href={homeHref} className="stylish-logo">
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} alt={tenant.name} width={120} height={40} className="h-10 w-auto object-contain" />
            ) : (
              brand
            )}
          </Link>

          <nav className="stylish-nav" aria-label="Primary">
            <Link href={homeHref}>Home</Link>
            <a href="#products">Men</a>
            <a href="#products">Women</a>
            <a href="#collections">Collections</a>
            <a href="#products">Sale</a>
          </nav>

          <div className="stylish-header-actions">
            <Search className="hidden h-5 w-5 lg:block" aria-hidden />
            <Link href={checkoutHref} className="stylish-cart-link">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart ({ready ? cartCount : 0})</span>
              {ready && cartCount > 0 && <span className="stylish-cart-badge">{cartCount}</span>}
            </Link>
            <button
              type="button"
              className="stylish-mobile-toggle lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="stylish-mobile-menu lg:hidden" aria-label="Mobile">
            <Link href={homeHref} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <a href="#products" onClick={() => setMenuOpen(false)}>
              Shop
            </a>
            <a href="#collections" onClick={() => setMenuOpen(false)}>
              Collections
            </a>
            <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
              Cart ({cartCount})
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
