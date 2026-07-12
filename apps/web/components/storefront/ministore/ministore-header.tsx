"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function MinistoreHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const brand = tenant.name.split(/\s+/)[0] ?? tenant.name;

  return (
    <header className="ministore-header">
      <div className="ministore-container-lg">
        <div className="ministore-nav-inner">
          <button
            type="button"
            className="ministore-mobile-toggle xl:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href={homeHref} className="ministore-logo">
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} alt={tenant.name} width={120} height={40} className="h-10 w-auto object-contain" />
            ) : (
              brand
            )}
          </Link>

          <nav className="ministore-nav" aria-label="Primary">
            <Link href={homeHref}>Home</Link>
            <a href="#services">Services</a>
            <a href="#mobile-products">Products</a>
            <a href="#watches">Watches</a>
            <a href="#sale">Sale</a>
          </nav>

          <div className="ministore-header-actions">
            <button type="button" className="ministore-icon-btn hidden sm:block" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" className="ministore-icon-btn hidden sm:block" aria-label="Account">
              <User className="h-5 w-5" />
            </button>
            <Link href={checkoutHref} className="ministore-cart-link" aria-label="Cart">
              <ShoppingCart className="h-6 w-6" />
              {ready && cartCount > 0 && <span className="ministore-cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <nav className="ministore-mobile-menu xl:hidden" aria-label="Mobile">
            <Link href={homeHref} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <a href="#mobile-products" onClick={() => setMenuOpen(false)}>
              Products
            </a>
            <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
              Cart ({ready ? cartCount : 0})
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
