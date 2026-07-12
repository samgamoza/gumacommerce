"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Phone, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { furnishBrandLines } from "./furnish-utils";

export function FurnishHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = furnishBrandLines(tenant.name, tenant.tagline);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;

  return (
    <header className="furnish-nav">
      <div className="furnish-container">
        <div className="furnish-nav-inner">
          <Link href={homeHref} aria-label={`${tenant.name} home`}>
            {tenant.logoUrl ? (
              <Image
                src={tenant.logoUrl}
                alt={tenant.name}
                width={120}
                height={40}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="furnish-brand">
                <span>{brand.line1}</span>
                <span>{brand.line2}</span>
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            <Link href={homeHref} className="text-sm font-medium text-[var(--furnish-gray-900)]">
              Home
            </Link>
            <a href="#collection" className="text-sm font-medium text-[var(--furnish-gray-600)] hover:text-[var(--furnish-gray-900)]">
              Products
            </a>
            <a href="#newsletter" className="text-sm font-medium text-[var(--furnish-gray-600)] hover:text-[var(--furnish-gray-900)]">
              Contact
            </a>
          </nav>

          <div className="furnish-nav-actions">
            {phone && (
              <span className="hidden items-center gap-2 text-sm font-bold text-[var(--furnish-gray-900)] sm:flex">
                <Phone className="h-4 w-4" />
                {phone}
              </span>
            )}
            <Link href={checkoutHref} className="furnish-cart-link" aria-label={`Cart with ${cartCount} items`}>
              <ShoppingCart className="h-6 w-6" />
              {ready && cartCount > 0 && (
                <span className="furnish-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </Link>
            <button
              type="button"
              className="rounded p-1 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[var(--furnish-gray-100)] py-4 lg:hidden" aria-label="Mobile">
            <ul className="flex flex-col gap-3">
              <li>
                <Link href={homeHref} onClick={() => setMenuOpen(false)} className="text-sm font-medium">
                  Home
                </Link>
              </li>
              <li>
                <a href="#collection" onClick={() => setMenuOpen(false)} className="text-sm font-medium">
                  Products
                </a>
              </li>
              <li>
                <Link href={checkoutHref} onClick={() => setMenuOpen(false)} className="text-sm font-medium">
                  Cart ({cartCount})
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
