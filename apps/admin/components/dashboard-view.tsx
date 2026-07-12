"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Link2,
  Package,
  PackageCheck,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { Badge, Button, Card, formatPrice } from "@guma-commerce/ui";
import type { SetupStep, TenantDashboardData } from "@guma-commerce/db";
import { DashboardModulesGrid } from "@/components/dashboard-modules-grid";

interface ShopResponse {
  ok: boolean;
  shop?: TenantDashboardData;
  urls?: { storefront: string; orderLink: string };
  error?: string;
}

function statusBadge(status: string) {
  if (status === "active") {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-800">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Live
      </Badge>
    );
  }
  return <Badge className="bg-amber-100 text-amber-800">Pending activation</Badge>;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const STATS = [
  {
    key: "totalSales",
    label: "Total sales",
    icon: Wallet,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    key: "orderCount",
    label: "Orders",
    icon: ShoppingBag,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-600",
  },
  {
    key: "activeProductCount",
    label: "Products online",
    icon: PackageCheck,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    key: "productCount",
    label: "All products",
    icon: Package,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
] as const;

export function DashboardView({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [data, setData] = useState<ShopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/shop");
    const json = (await res.json()) as ShopResponse;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function activateShop() {
    setActivating(true);
    setMessage(null);
    const res = await fetch("/api/shop/activate", { method: "POST" });
    const json = await res.json();
    setActivating(false);
    if (json.ok) {
      setMessage("Your shop is now live!");
      await load();
      router.refresh();
    } else {
      setMessage(json.error ?? "Could not activate shop.");
    }
  }

  async function copyLink() {
    if (!data?.urls?.orderLink) return;
    await navigator.clipboard.writeText(data.urls.orderLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!data?.ok || !data.shop || !data.urls) {
    return <p className="text-red-600">{data?.error ?? "Could not load dashboard."}</p>;
  }

  const { shop, urls } = data;
  const isLive = shop.tenant.status === "active";

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-emerald-100">
        <div className="absolute inset-0 hero-glow opacity-60" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {greeting()}, {displayName.split(" ")[0]}!
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                @{shop.tenant.slug}
              </h2>
              {statusBadge(shop.tenant.status)}
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              {shop.tenant.name}
              {isLive && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLive ? (
              <a href={urls.storefront} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  Go to my shop
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            ) : (
              <Button size="sm" onClick={activateShop} disabled={!shop.setup.canActivate || activating}>
                {activating ? "Activating..." : "Activate shop"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          const value =
            stat.key === "totalSales"
              ? formatPrice(shop.stats.totalSales)
              : shop.stats[stat.key];
          return (
            <Card key={stat.key} className="transition hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
                </div>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {shop.setup.progressPercent < 100 && (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold tracking-tight">Complete your setup</h3>
              <p className="text-sm text-muted-foreground">
                {shop.setup.progressPercent}% complete
              </p>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${shop.setup.progressPercent}%` }}
              />
            </div>
          </div>
          <ul className="space-y-2">
            {shop.setup.steps.map((step: SetupStep) => (
              <li
                key={step.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                  step.completed
                    ? "border-transparent bg-emerald-50/60"
                    : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={`text-sm ${
                      step.completed
                        ? "text-muted-foreground line-through decoration-emerald-300"
                        : "font-medium text-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {!step.completed && step.href && step.action && (
                  <Link href={step.href}>
                    <Button variant="secondary" size="sm" className="gap-1">
                      {step.action}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {!step.completed && step.id === "activate" && shop.setup.canActivate && (
                  <Button size="sm" onClick={activateShop} disabled={activating}>
                    Activate
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <Link2 className="h-4 w-4 text-emerald-600" />
          </span>
          <div>
            <p className="text-sm font-semibold">Your Order Now link</p>
            <p className="text-xs text-muted-foreground">
              Drop this in your FB, TikTok, and IG posts
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2.5">
          <code className="min-w-0 flex-1 truncate text-xs text-emerald-700">
            {urls.orderLink}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-card px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        {!isLive && (
          <p className="mt-2 text-xs text-amber-700">
            Link goes live after you add at least one active product (or tap Activate shop).
          </p>
        )}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/products">
            <Button className="w-full">Add product</Button>
          </Link>
          <Link href="/orders">
            <Button variant="secondary" className="w-full">
              View orders
            </Button>
          </Link>
          <Button variant="secondary" className="w-full" onClick={copyLink}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
          {isLive ? (
            <a href={urls.storefront} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full">
                Preview shop
              </Button>
            </a>
          ) : (
            <Button
              className="w-full"
              onClick={activateShop}
              disabled={!shop.setup.canActivate || activating}
            >
              Activate shop
            </Button>
          )}
        </div>
      </Card>

      <DashboardModulesGrid />
    </div>
  );
}
