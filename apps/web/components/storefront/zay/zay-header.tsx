"use client";

import Image from "next/image";
import Link from "next/link";
import { Globe, Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { shopPublicUrl, shopPublicUrlLabel } from "@/lib/utils";
import { zayBrandMark } from "./zay-utils";

export function ZayHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = zayBrandMark(tenant.name);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;
  const siteUrl = shopPublicUrl(tenant.slug);
  const siteLabel = shopPublicUrlLabel(tenant.slug);

  return (
    <>
      <div className="zay-topbar">
        <div className="zay-container">
          <div className="zay-topbar-inner">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                <a href={siteUrl}>{siteLabel}</a>
              </span>
              {phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:${phone}`}>{phone}</a>
                </span>
              )}
            </div>
            <span className="text-sm">{tenant.location}</span>
          </div>
        </div>
      </div>

      <header className="zay-header">
        <div className="zay-container">
          <div className="zay-header-inner">
            <Link href={homeHref} className="zay-logo">
              <span className="zay-logo-primary">{brand.primary}</span>{" "}
              <span className="zay-logo-rest">{brand.rest}</span>
            </Link>

            <nav className="zay-nav" aria-label="Primary">
              <Link href={homeHref}>Home</Link>
              <a href="#categories">Shop</a>
              <a href="#featured">Featured</a>
              <a href="#footer">Contact</a>
            </nav>

            <div className="zay-header-actions">
              <Search className="hidden h-5 w-5 lg:block" aria-hidden />
              <Link href={checkoutHref} className="zay-cart-link" aria-label={`Cart with ${cartCount} items`}>
                <ShoppingCart className="h-5 w-5" />
                {ready && cartCount > 0 && (
                  <span className="zay-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
                )}
              </Link>
              <button
                type="button"
                className="lg:hidden"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="zay-mobile-nav lg:hidden" aria-label="Mobile">
              <Link href={homeHref} onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <a href="#categories" onClick={() => setMenuOpen(false)}>
                Shop
              </a>
              <a href="#featured" onClick={() => setMenuOpen(false)}>
                Featured
              </a>
              <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
