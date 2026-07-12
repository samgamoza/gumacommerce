"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { formatFoodmartPrice } from "./foodmart-utils";

export function FoodmartHeader({ tenant }: { tenant: DemoTenant }) {
  const { items, ready, subtotal } = useCart(tenant.slug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = `/${tenant.slug}`;
  const checkoutHref = `/${tenant.slug}/checkout`;
  const phone =
    tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone
      ? tenant.storeSettings.whatsapp.phone
      : null;

  const categories = useMemo(() => {
    if (tenant.shopCategories.length > 0) return tenant.shopCategories;
    return [...new Set(tenant.products.map((p) => p.category))].map((name, i) => ({
      id: `cat-${i}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }));
  }, [tenant]);

  const brandInitial = tenant.name.trim().charAt(0).toUpperCase();

  return (
    <header>
      <div className="foodmart-container foodmart-header-top">
        <Link href={homeHref} className="foodmart-logo">
          {tenant.logoUrl ? (
            <Image src={tenant.logoUrl} alt={tenant.name} width={140} height={40} className="h-10 w-auto object-contain" />
          ) : (
            <>
              <span className="foodmart-logo-mark">{brandInitial}</span>
              {tenant.name}
            </>
          )}
        </Link>

        <form className="foodmart-search" onSubmit={(e) => e.preventDefault()} role="search">
          <select aria-label="Category">
            <option>All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input type="search" placeholder="Search products…" aria-label="Search products" />
          <button type="submit" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
        </form>

        <div className="foodmart-header-actions">
          {phone && (
            <div className="foodmart-support">
              <small>For Support?</small>
              <strong>{phone}</strong>
            </div>
          )}
          <Link href={checkoutHref} className="foodmart-cart-btn">
            <small>Your Cart ({ready ? cartCount : 0})</small>
            <span className="foodmart-cart-total">{formatFoodmartPrice(subtotal)}</span>
          </Link>
        </div>
      </div>

      <div className="foodmart-container foodmart-nav-bar">
        <select aria-label="Shop by department" defaultValue="">
          <option value="" disabled>
            Shop by Departments
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <ul className="foodmart-nav-links">
          <li>
            <Link href={homeHref}>Home</Link>
          </li>
          <li>
            <a href="#products">Shop</a>
          </li>
          <li>
            <a href="#categories">Categories</a>
          </li>
          <li>
            <a href="#footer">Contact</a>
          </li>
        </ul>

        <button
          type="button"
          className="foodmart-mobile-toggle lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {menuOpen && (
          <nav className="foodmart-mobile-menu lg:hidden" aria-label="Mobile">
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
