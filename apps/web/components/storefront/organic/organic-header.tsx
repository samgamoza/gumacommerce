"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function OrganicHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const brand = tenant.name.split(/\s+/)[0] ?? tenant.name;

  return (
    <header className="organic-header">
      <div className="organic-container-lg">
        <div className="organic-header-grid">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="organic-mobile-toggle lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link href={homeHref} className="organic-logo">
              {tenant.logoUrl ? (
                <Image src={tenant.logoUrl} alt={tenant.name} width={120} height={40} className="h-10 w-auto object-contain" />
              ) : (
                brand
              )}
            </Link>
          </div>

          <div className="organic-search">
            <Search className="h-5 w-5 shrink-0 text-[var(--og-muted)]" aria-hidden />
            <input type="search" placeholder="Search fresh produce & pantry staples" aria-label="Search products" />
          </div>

          <nav className="organic-nav" aria-label="Primary">
            <Link href={homeHref}>Home</Link>
            <a href="#products">Shop</a>
            <a href="#categories">Categories</a>
            <a href="#footer">Contact</a>
          </nav>

          <div className="organic-header-actions">
            <Link href={checkoutHref} className="organic-cart-link">
              <ShoppingBag className="h-5 w-5" />
              Cart ({ready ? cartCount : 0})
              {ready && cartCount > 0 && <span className="organic-cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <nav className="organic-mobile-menu lg:hidden" aria-label="Mobile">
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
    </header>
  );
}
