"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Menu, Phone, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";

export function MellowHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const brand = tenant.name.split(/\s+/)[0] ?? tenant.name;
  const phone = tenant.storeSettings.whatsapp.phone;

  return (
    <header className="mellow-header">
      <div className="mellow-topbar">
        <div className="mellow-container-fluid">
          <div className="mellow-topbar-inner">
            <ul className="mellow-topbar-info">
              <li>
                <MapPin className="h-4 w-4 text-[var(--ml-primary)]" aria-hidden />
                {tenant.location}
              </li>
              {phone && (
                <li>
                  <Phone className="h-4 w-4 text-[var(--ml-primary)]" aria-hidden />
                  {phone}
                </li>
              )}
              <li className="hidden sm:flex">
                <Mail className="h-4 w-4 text-[var(--ml-primary)]" aria-hidden />
                reservations@{tenant.slug.replace("-demo", "")}.com
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mellow-container-fluid">
        <div className="mellow-nav-inner">
          <Link href={homeHref} className="mellow-logo">
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} alt={tenant.name} width={140} height={44} className="h-11 w-auto object-contain" />
            ) : (
              brand
            )}
          </Link>

          <nav className="mellow-nav" aria-label="Primary">
            <Link href={homeHref}>Home</Link>
            <a href="#about">About</a>
            <a href="#rooms">Rooms</a>
            <a href="#services">Services</a>
            <a href="#footer">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href={checkoutHref} className="mellow-cart-link">
              <ShoppingCart className="h-5 w-5" />
              Book ({ready ? cartCount : 0})
            </Link>
            <button
              type="button"
              className="mellow-mobile-toggle lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mellow-mobile-menu lg:hidden" aria-label="Mobile">
            <Link href={homeHref} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <a href="#rooms" onClick={() => setMenuOpen(false)}>
              Rooms
            </a>
            <Link href={checkoutHref} onClick={() => setMenuOpen(false)}>
              Book ({cartCount})
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
