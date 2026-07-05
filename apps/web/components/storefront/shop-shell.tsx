"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  User,
} from "lucide-react";
import type { DemoTenant } from "@/lib/demo-data";
import { useCart } from "@/lib/cart";
import { whatsappChatUrl } from "@/lib/storefront-settings";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { LockedAssistantFab } from "@/components/storefront/premium/locked-assistant-fab";
import { hasProFeatures } from "@/lib/storefront-plans";
import { displayFontStack } from "@/components/storefront/theme-shell";
import { STOREFRONT_SETTINGS_LINKS } from "@/lib/settings-nav";
import { adminUrl, storefrontUrl } from "@/lib/utils";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setCoarse(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return coarse;
}

const SETTINGS_ICONS: Record<string, React.ReactNode> = {
  Shop: <Store className="h-4 w-4" />,
  "Delivery & Shipping": <Truck className="h-4 w-4" />,
  Notifications: <Bell className="h-4 w-4" />,
  Subscription: <CreditCard className="h-4 w-4" />,
  "WhatsApp Agent": <MessageCircle className="h-4 w-4" />,
  Tracking: <BarChart3 className="h-4 w-4" />,
};

export function ShopShell({
  tenant,
  children,
}: {
  tenant: DemoTenant;
  children: React.ReactNode;
}) {
  const { count: cartCount, subtotal: cartTotal } = useCart(tenant.slug);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const isCoarsePointer = useCoarsePointer();

  const accent = tenant.shopTheme?.primaryColor ?? tenant.theme.primaryColor;
  const fontStack = tenant.shopTheme ? displayFontStack(tenant.shopTheme) : undefined;

  function openOwnerMenu() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOwnerMenuOpen(true);
  }

  function scheduleCloseOwnerMenu() {
    if (isCoarsePointer) return;
    closeTimerRef.current = window.setTimeout(() => {
      setOwnerMenuOpen(false);
    }, 120);
  }

  function toggleOwnerMenu() {
    setOwnerMenuOpen((open) => !open);
  }

  useEffect(() => {
    if (!ownerMenuOpen) setSettingsOpen(false);
  }, [ownerMenuOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-white text-neutral-900"
      style={fontStack ? ({ ["--font-bricolage" as string]: fontStack } as React.CSSProperties) : undefined}
    >
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-5">
          <Link href={`/${tenant.slug}`} className="min-w-0 flex-1">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 w-auto max-w-[220px] object-contain md:h-12"
              />
            ) : (
              <span className="block truncate font-display text-xl font-bold tracking-tight md:text-3xl">
                {tenant.name}
              </span>
            )}
          </Link>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <Link
              href={`/${tenant.slug}/checkout`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 transition hover:bg-neutral-50"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            <div
              className="relative"
              onMouseEnter={openOwnerMenu}
              onMouseLeave={scheduleCloseOwnerMenu}
            >
              <button
                type="button"
                onClick={toggleOwnerMenu}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  ownerMenuOpen
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 hover:bg-neutral-50"
                }`}
                aria-label="Account menu"
                aria-expanded={ownerMenuOpen}
                aria-haspopup="menu"
              >
                <User className="h-5 w-5" />
              </button>

              {ownerMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 pt-2"
                  role="menu"
                  onMouseEnter={openOwnerMenu}
                  onMouseLeave={scheduleCloseOwnerMenu}
                >
                  <div className="w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-2 shadow-xl">
                    <OwnerMenuLink
                      href={`${storefrontUrl}/${tenant.slug}`}
                      icon={<Store className="h-4 w-4" />}
                      highlight
                    >
                      Go to my shop
                    </OwnerMenuLink>
                    <OwnerMenuLink
                      href={`${adminUrl}/`}
                      icon={<LayoutDashboard className="h-4 w-4" />}
                    >
                      Dashboard
                    </OwnerMenuLink>
                    <OwnerMenuLink
                      href={`${adminUrl}/products`}
                      icon={<Package className="h-4 w-4" />}
                    >
                      Products
                    </OwnerMenuLink>
                    <OwnerMenuLink
                      href={`${adminUrl}/categories`}
                      icon={<Tag className="h-4 w-4" />}
                    >
                      Categories
                    </OwnerMenuLink>
                    <OwnerMenuLink
                      href={`${adminUrl}/shop-builder`}
                      icon={<LayoutGrid className="h-4 w-4" />}
                    >
                      Shop Builder
                    </OwnerMenuLink>
                    <OwnerMenuLink
                      href={`${adminUrl}/orders`}
                      icon={<ShoppingBag className="h-4 w-4" />}
                    >
                      Orders
                    </OwnerMenuLink>

                    <div className="my-1 border-t border-neutral-100" />

                    <button
                      type="button"
                      role="menuitem"
                      aria-expanded={settingsOpen}
                      onClick={() => setSettingsOpen((open) => !open)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-neutral-400">
                          <Settings className="h-4 w-4" />
                        </span>
                        Settings
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-neutral-400 transition ${settingsOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {settingsOpen && (
                      <div className="border-t border-neutral-100 bg-neutral-50/80 py-1">
                        {STOREFRONT_SETTINGS_LINKS.map((item) => (
                          <Link
                            key={item.href}
                            href={`${adminUrl}${item.href}`}
                            role="menuitem"
                            className="flex items-center gap-3 px-4 py-2 pl-11 text-sm text-neutral-600 transition hover:bg-white hover:text-neutral-900"
                          >
                            <span className="text-neutral-400">
                              {SETTINGS_ICONS[item.label] ?? <Settings className="h-4 w-4" />}
                            </span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="my-1 border-t border-neutral-100" />
                    <OwnerMenuLink href={`${adminUrl}/login`} icon={<LogOut className="h-4 w-4" />}>
                      Log out
                    </OwnerMenuLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {children}

      {tenant.storeSettings.shopAssistant.enabled &&
        (hasProFeatures(tenant.subscriptionPlan) ? (
          <ShopAssistant
            tenantSlug={tenant.slug}
            shopName={tenant.name}
            assistant={tenant.storeSettings.shopAssistant}
          />
        ) : (
          <LockedAssistantFab theme={tenant.shopTheme} />
        ))}

      {tenant.storeSettings.whatsapp.enabled && tenant.storeSettings.whatsapp.phone && (
        <a
          href={
            whatsappChatUrl(
              tenant.storeSettings.whatsapp.phone,
              `${tenant.storeSettings.whatsapp.greeting}\n\n${storefrontUrl}/${tenant.slug}`
            ) ?? "#"
          }
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105 md:bottom-8"
          style={{ backgroundColor: "#25D366" }}
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur-md safe-bottom">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-500">{cartCount} in cart</p>
              <p className="text-lg font-bold">{formatPrice(cartTotal)}</p>
            </div>
            <Link
              href={`/${tenant.slug}/checkout`}
              className="rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
              style={{ backgroundColor: accent, boxShadow: `0 8px 20px -6px ${accent}66` }}
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function OwnerMenuLink({
  href,
  icon,
  children,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
        highlight
          ? "bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-100"
          : "text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      <span className={highlight ? "text-emerald-600" : "text-neutral-400"}>{icon}</span>
      {children}
    </Link>
  );
}
