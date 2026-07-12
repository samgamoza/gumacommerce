"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Gem,
  LogOut,
  Monitor,
  Rocket,
  Search,
  Settings,
  Store,
} from "lucide-react";
import { GumaMark } from "@guma-commerce/ui";
import { UpgradeGateModal } from "@/components/plan/upgrade-gate-modal";
import { PlanTierBadge } from "@/components/plan/plan-tier-badge";
import { useTenantPlan } from "@/components/plan/use-tenant-plan";
import { DASHBOARD_NAV, type DashboardNavItem } from "@/lib/dashboard-nav";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav";
import { planAtLeast, upgradeHref, type SubscriptionPlan } from "@/lib/plan-access";
import { storefrontBaseUrl } from "@/lib/utils";

interface SessionUser {
  tenantName: string;
  tenantSlug: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  tenantStatus?: string;
}

interface GateTarget {
  item: DashboardNavItem;
}

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/settings"));
  const [gateTarget, setGateTarget] = useState<GateTarget | null>(null);
  const { plan, planLabel, credits, tenant, loading: planLoading } = useTenantPlan();

  useEffect(() => {
    if (pathname.startsWith("/settings")) setSettingsOpen(true);
  }, [pathname]);

  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    for (const group of DASHBOARD_NAV) {
      if (group.defaultOpen) defaults[group.id] = true;
      if (group.items.some((item) => pathname.startsWith(item.href) && item.href !== "/")) {
        defaults[group.id] = true;
      }
    }
    setOpenGroups((prev) => ({ ...defaults, ...prev }));
  }, [pathname]);

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
          tenantStatus: shopData?.ok ? shopData.shop.tenant.status : tenant?.status,
        });
      }
    });
  }, [tenant?.status]);

  const filteredNav = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DASHBOARD_NAV;
    return DASHBOARD_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [search]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isLocked(item: DashboardNavItem): boolean {
    if (!item.minPlan || item.minPlan === "free") return false;
    return !planAtLeast(plan, item.minPlan);
  }

  function handleNavClick(event: React.MouseEvent, item: DashboardNavItem) {
    if (!isLocked(item)) return;
    event.preventDefault();
    setGateTarget({ item });
  }

  const storefrontBase = storefrontBaseUrl;
  const slug = user?.tenantSlug ?? tenant?.slug;
  const showUpgrade = plan !== "pro";

  return (
    <div className="min-h-screen bg-[#f8f9fb] lg:flex">
      <UpgradeGateModal
        open={gateTarget !== null}
        onClose={() => setGateTarget(null)}
        requiredPlan={
          (gateTarget?.item.minPlan === "pro" ? "pro" : "growth") as Exclude<
            SubscriptionPlan,
            "free"
          >
        }
        featureTitle={gateTarget?.item.label ?? "this feature"}
        featureDescription={gateTarget?.item.description}
        refSource={gateTarget ? `nav-${gateTarget.item.id}` : undefined}
      />

      {/* Sidebar — Base44-style */}
      <aside className="flex w-full flex-col border-b border-gray-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[240px] lg:shrink-0 lg:border-b-0 lg:border-r">
        <Link href="/" className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-4">
          <GumaMark className="h-8 w-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">
              {user?.tenantName ?? tenant?.name ?? "Your shop"}
            </p>
            <p className="truncate text-[11px] text-gray-500">
              {user?.displayName ?? "Seller workspace"}
            </p>
          </div>
        </Link>

        <div className="border-b border-gray-100 px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {filteredNav.map((group) => {
            if (group.id === "settings") return null;
            const isCollapsible = group.collapsible && group.label;
            const expanded = openGroups[group.id] ?? !isCollapsible;

            return (
              <div key={group.id} className="pb-1">
                {group.label ? (
                  isCollapsible ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((g) => ({ ...g, [group.id]: !expanded }))
                      }
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600"
                    >
                      {group.label}
                      <ChevronDown
                        className={`h-3 w-3 transition ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  ) : (
                    <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </p>
                  )
                ) : null}

                {(expanded || !isCollapsible) &&
                  group.items.map((item) => {
                    const active = isActive(item.href);
                    const locked = isLocked(item);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item)}
                        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                          active
                            ? "bg-emerald-50 font-semibold text-emerald-800"
                            : locked
                              ? "text-gray-400 hover:bg-gray-50"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${active ? "text-emerald-600" : "text-gray-400"}`}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge === "new" ? (
                          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">
                            New
                          </span>
                        ) : null}
                        {locked && item.minPlan ? (
                          <PlanTierBadge tier={item.minPlan} className="scale-90" />
                        ) : null}
                      </Link>
                    );
                  })}
              </div>
            );
          })}

          {/* Full settings tree */}
          <div className="border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((o) => !o);
                if (!settingsOpen && !pathname.startsWith("/settings")) {
                  router.push("/settings/shop");
                }
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium ${
                pathname.startsWith("/settings")
                  ? "bg-emerald-50 font-semibold text-emerald-800"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-gray-400" />
                Settings
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-400 transition ${settingsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {settingsOpen ? (
              <div className="ml-2 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
                {SETTINGS_SECTIONS.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={`block rounded-lg px-2.5 py-1.5 text-xs ${
                      pathname === section.href
                        ? "font-semibold text-emerald-700"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        {/* AI credits strip — Base44 pattern */}
        {!planLoading && credits ? (
          <div className="mx-2 mb-2 rounded-xl border border-amber-100 bg-amber-50/80 p-3">
            <p className="text-xs font-medium text-amber-900">
              {credits.generationsLeft} AI generations left this month
            </p>
            <p className="mt-0.5 text-[10px] text-amber-800/80">
              {planLabel} plan · {credits.chatLeft} chats today
            </p>
            {showUpgrade ? (
              <Link
                href={upgradeHref(plan === "free" ? "growth" : "pro", "sidebar-credits")}
                className="mt-2 inline-flex text-[11px] font-semibold text-amber-700 underline"
              >
                View plans
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="hidden border-t border-gray-100 p-3 lg:block">
          {user ? (
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {user.displayName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0 text-xs">
                <p className="truncate font-semibold text-gray-900">{user.displayName}</p>
                <p className="truncate text-gray-500">{user.email}</p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
            {slug ? (
              <a
                href={`${storefrontBase}/${slug}?preview=1`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-gray-600 hover:bg-white hover:text-gray-900"
              >
                <Monitor className="h-3.5 w-3.5" />
                Preview
              </a>
            ) : null}
            <span className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 font-semibold text-gray-900 shadow-sm">
              <Store className="h-3.5 w-3.5 text-emerald-600" />
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2">
            {showUpgrade ? (
              <Link
                href={upgradeHref(plan === "free" ? "growth" : "pro", "topbar")}
                className="hidden items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 sm:inline-flex"
              >
                <Gem className="h-3.5 w-3.5" />
                Upgrade
              </Link>
            ) : null}
            {slug ? (
              <a
                href={`${storefrontBase}/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                <Rocket className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View shop</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              Sign out
            </button>
          </div>
        </header>

        {user && !user.emailVerified && pathname !== "/onboarding" ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 lg:px-6">
            Verify your email to unlock all features.{" "}
            <Link href="/onboarding" className="font-semibold underline">
              Complete setup
            </Link>
          </div>
        ) : null}

        <div className="flex-1 px-4 py-6 lg:px-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
