"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function FruitablesHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const brand = tenant.name.split(/\s+/)[0] ?? tenant.name;
  const phone = tenant.storeSettings.whatsapp.phone;

  return (
    <div className="fruitables-header-wrap">
      <div className="fruitables-container-lg pt-3">
        <div className="fruitables-topbar">
          <div className="flex flex-wrap items-center gap-4">
            <small className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden />
              {tenant.location}
            </small>
            {phone && (
              <small className="flex items-center gap-2">
                <Mail className="h-4 w-4" aria-hidden />
                {phone}
              </small>
            )}
          </div>
          <div className="flex gap-2">
            <a href="#footer">Privacy</a>
            <span>/</span>
            <a href="#footer">Terms</a>
          </div>
        </div>
      </div>

      <header className="fruitables-header">
        <div className="fruitables-container-lg">
          <div className="fruitables-nav-inner">
            <button
              type="button"
              className="fruitables-mobile-toggle xl:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link href={homeHref} className="fruitables-logo">
              {tenant.logoUrl ? (
                <Image src={tenant.logoUrl} alt={tenant.name} width={140} height={44} className="h-11 w-auto object-contain" />
              ) : (
                brand
              )}
            </Link>

            <nav className="fruitables-nav" aria-label="Primary">
              <Link href={homeHref}>Home</Link>
              <a href="#products">Shop</a>
              <a href="#vegetables">Vegetables</a>
              <a href="#footer">Contact</a>
            </nav>

            <div className="fruitables-header-actions">
              <button type="button" className="fruitables-icon-btn hidden sm:flex" aria-label="Search">
                <Search className="h-5 w-5" />
              </button>
              <Link href={checkoutHref} className="fruitables-cart-link" aria-label="Cart">
                <ShoppingBag className="h-8 w-8" />
                {ready && cartCount > 0 && <span className="fruitables-cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>

          {menuOpen && (
            <nav className="fruitables-mobile-menu xl:hidden" aria-label="Mobile">
              <Link href={homeHref} onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <a href="#products" onClick={() => setMenuOpen(false)}>
                Shop
              </a>
              <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
                Cart ({ready ? cartCount : 0})
              </Link>
            </nav>
          )}
        </div>
      </header>
    </div>
  );
}
