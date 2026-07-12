"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function KairaHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const brand = tenant.name.split(/\s+/)[0] ?? tenant.name;

  return (
    <header className="kaira-header">
      <div className="kaira-container">
        <div className="kaira-header-inner">
          <Link href={homeHref} className="kaira-logo">
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} alt={tenant.name} width={100} height={36} className="h-9 w-auto object-contain" />
            ) : (
              brand
            )}
          </Link>

          <nav className="kaira-nav" aria-label="Primary">
            <Link href={homeHref}>Home</Link>
            <a href="#products">Shop</a>
            <a href="#collection">Collection</a>
            <a href="#footer">Contact</a>
          </nav>

          <div className="kaira-header-actions">
            <Search className="hidden h-5 w-5 lg:block" aria-hidden />
            <Link href={checkoutHref} className="kaira-cart-link">
              Cart ({ready ? cartCount : 0})
              {ready && cartCount > 0 && <span className="kaira-cart-badge">{cartCount}</span>}
            </Link>
            <button
              type="button"
              className="kaira-mobile-toggle lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="kaira-mobile-menu lg:hidden" aria-label="Mobile">
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
