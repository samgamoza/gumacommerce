"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

function BrandMark({
  name,
  logoUrl,
  primary,
}: {
  name: string;
  logoUrl?: string;
  primary: string;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={120}
        height={40}
        className="h-9 w-auto object-contain"
      />
    );
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return (
      <span className="text-2xl font-semibold tracking-tight text-gray-900">
        {parts[0]}
        <span style={{ color: primary }}>.</span>
      </span>
    );
  }

  const accent = parts.pop();
  return (
    <span className="text-2xl font-semibold tracking-tight text-gray-900">
      {parts.join(" ")}
      <span style={{ color: primary }}> {accent}</span>
    </span>
  );
}

export function BloomHeader({
  tenantSlug,
  shopName,
  logoUrl,
  primary,
}: {
  tenantSlug: string;
  shopName: string;
  logoUrl?: string;
  primary: string;
}) {
  const { items, ready } = useCart(tenantSlug);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const homeHref = `/${tenantSlug}`;
  const checkoutHref = `/${tenantSlug}/checkout`;

  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => {
    closeMobileMenu();
  }, [tenantSlug, closeMobileMenu]);

  return (
    <header className="bloom-header">
      <div className="container mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href={homeHref} aria-label={`${shopName} home`}>
            <BrandMark name={shopName} logoUrl={logoUrl} primary={primary} />
          </Link>

          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                aria-label="Search products"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="rounded-full p-2 hover:bg-gray-100 lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-700" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileOpen((prev) => !prev)}
              className="rounded-full p-2 hover:bg-gray-100 md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>

            <Link
              href={checkoutHref}
              className="relative rounded-full p-2 transition hover:bg-gray-100"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {ready && cartCount > 0 && (
                <span className="bloom-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        {isSearchOpen && (
          <div className="relative mt-4 lg:hidden">
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              aria-label="Search products"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        )}

        {isMobileOpen && (
          <nav className="mt-4 border-b border-gray-200 pb-4 md:hidden" aria-label="Mobile">
            <Link
              href={checkoutHref}
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View cart ({cartCount})
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
