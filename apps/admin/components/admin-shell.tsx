"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  CreditCard,
  ExternalLink,
  FolderOpen,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { GumaMark } from "@guma-commerce/ui";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: FolderOpen },
  { href: "/shop-builder", label: "Shop Builder", icon: LayoutGrid },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/ai-studio", label: "AI Studio", icon: Sparkles },
  { href: "/agents", label: "Agents", icon: Bot },
];

const SETTINGS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shop: Store,
  "Delivery & Shipping": Truck,
  Notifications: Bell,
  Subscription: CreditCard,
  "WhatsApp Agent": MessageCircle,
  Tracking: BarChart3,
};

interface SessionUser {
  tenantName: string;
  tenantSlug: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  tenantStatus?: string;
}

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const onSettingsRoute = pathname.startsWith("/settings");
  const [settingsOpen, setSettingsOpen] = useState(onSettingsRoute);

  useEffect(() => {
    if (onSettingsRoute) setSettingsOpen(true);
  }, [onSettingsRoute]);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((res) => res.json()),
      fetch("/api/shop")
        .then((res) => res.json())
        .catch(() => null),
    ]).then(([sessionData, shopData]) => {
      if (sessionData.ok) {
        setUser({
          ...sessionData.user,
          tenantStatus: shopData?.ok ? shopData.shop.tenant.status : undefined,
        });
      }
    });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isNavActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <Link href="/" className="flex items-center gap-2.5 px-4 py-5">
          <GumaMark className="h-9 w-9 shrink-0 drop-shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold leading-tight tracking-tight">
              Guma<span className="text-primary">Commerce</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.tenantName ?? "Loading..."}
            </p>
          </div>
        </Link>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-3">
          {user?.tenantSlug && (
            <a
              href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}/${user.tenantSlug}`}
              target="_blank"
              rel="noreferrer"
              className="mb-2 flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-emerald-700 lg:mx-1"
            >
              <Store className="h-4 w-4" />
              Go to my shop
              <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
            </a>
          )}

          {NAV.map((item) => {
            const active = isNavActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:mx-1 ${
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground/70"}`}
                />
                {item.label}
              </Link>
            );
          })}

          <div className="shrink-0 lg:mx-1">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((open) => !open);
                if (!settingsOpen && !onSettingsRoute) {
                  router.push("/settings/shop");
                }
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                onSettingsRoute
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings
                  className={`h-4 w-4 shrink-0 ${onSettingsRoute ? "text-primary" : "text-muted-foreground/70"}`}
                />
                Settings
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground/70 transition ${settingsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {settingsOpen && (
              <div className="mt-1 space-y-0.5 border-l-2 border-primary/20 pl-2 lg:ml-4">
                {SETTINGS_SECTIONS.map((section) => {
                  const active = pathname === section.href;
                  const Icon = SETTINGS_ICONS[section.label] ?? Settings;
                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-70" />
                      {section.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden border-t border-border px-4 py-4 lg:block">
          {user && (
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                {user.displayName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0 text-xs">
                <p className="truncate font-semibold text-foreground">{user.displayName}</p>
                <p className="truncate text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {user && !user.emailVerified && pathname !== "/onboarding" && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:px-8">
            Verify your email to unlock all features.{" "}
            <Link href="/onboarding" className="font-semibold underline">
              Complete setup
            </Link>
          </div>
        )}
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted lg:hidden"
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
