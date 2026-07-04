"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav";

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "🏷️" },
  { href: "/categories", label: "Categories", icon: "🗂️" },
  { href: "/shop-builder", label: "Shop Builder", icon: "🎨" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/ai-studio", label: "AI Studio", icon: "✨" },
  { href: "/agents", label: "Agents", icon: "🤖" },
];

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
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className="border-b border-violet-100 bg-violet-50/60 lg:w-64 lg:border-b-0 lg:border-r lg:border-violet-100">
        <div className="flex items-center gap-2 px-4 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-lg text-white">
            🛒
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900">Guma Commerce</p>
            <p className="truncate text-xs text-gray-500">
              {user?.tenantName ?? "Loading..."}
            </p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:px-3">
          {user?.tenantSlug && (
            <a
              href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}/${user.tenantSlug}`}
              target="_blank"
              rel="noreferrer"
              className="mb-2 flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 lg:mx-1"
            >
              <span>🏪</span>
              Go to my shop
            </a>
          )}

          {NAV.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:mx-1 ${
                  active
                    ? "bg-white text-violet-800 shadow-sm"
                    : "text-gray-600 hover:bg-white/70"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div className="lg:mx-1">
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
                  ? "bg-white text-violet-800 shadow-sm"
                  : "text-gray-600 hover:bg-white/70"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>⚙️</span>
                Settings
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-400 transition ${settingsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {settingsOpen && (
              <div className="mt-1 space-y-0.5 border-l-2 border-violet-200 pl-2 lg:ml-4">
                {SETTINGS_SECTIONS.map((section) => {
                  const active = pathname === section.href;
                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-violet-100 font-medium text-violet-900"
                          : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
                      }`}
                    >
                      <span className="text-base leading-none">{section.icon}</span>
                      {section.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden border-t border-violet-100 px-4 py-4 lg:block">
          {user && (
            <div className="mb-3 text-xs text-gray-500">
              <p className="truncate font-medium text-gray-700">{user.displayName}</p>
              <p className="truncate">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-violet-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1">
        {user && !user.emailVerified && pathname !== "/onboarding" && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:px-8">
            Verify your email to unlock all features.{" "}
            <Link href="/onboarding" className="font-semibold underline">
              Complete setup
            </Link>
          </div>
        )}
        <header className="border-b border-gray-200 bg-white px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold">{title}</h1>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 lg:hidden"
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
