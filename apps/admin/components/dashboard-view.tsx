"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, formatPrice } from "@guma-commerce/ui";
import type { SetupStep, TenantDashboardData } from "@guma-commerce/db";

interface ShopResponse {
  ok: boolean;
  shop?: TenantDashboardData;
  urls?: { storefront: string; orderLink: string };
  error?: string;
}

function statusBadge(status: string) {
  if (status === "active") {
    return <Badge className="bg-emerald-100 text-emerald-800">Live</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-800">Pending activation</Badge>;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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
    return <p className="text-gray-500">Loading your dashboard...</p>;
  }

  if (!data?.ok || !data.shop || !data.urls) {
    return <p className="text-red-600">{data?.error ?? "Could not load dashboard."}</p>;
  }

  const { shop, urls } = data;
  const isLive = shop.tenant.status === "active";

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100 bg-gradient-to-r from-white to-emerald-50/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              {greeting()}, {displayName.split(" ")[0]}!
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">@{shop.tenant.slug}</h2>
              {statusBadge(shop.tenant.status)}
            </div>
            <p className="mt-1 text-sm text-gray-600">{shop.tenant.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLive ? (
              <a href={urls.storefront} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm">
                  Go to my shop
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">Complete your setup</h3>
            <p className="text-sm text-gray-500">{shop.setup.progressPercent}% complete</p>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${shop.setup.progressPercent}%` }}
            />
          </div>
        </div>
        <ul className="space-y-3">
          {shop.setup.steps.map((step: SetupStep) => (
            <li key={step.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={step.completed ? "text-emerald-600" : "text-gray-400"}>
                  {step.completed ? "✓" : "○"}
                </span>
                <span className={`text-sm ${step.completed ? "text-gray-700" : "text-gray-900"}`}>
                  {step.label}
                </span>
              </div>
              {!step.completed && step.href && step.action && (
                <Link href={step.href}>
                  <Button variant="secondary" size="sm">
                    {step.action}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-gray-500">Total sales</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(shop.stats.totalSales)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Orders</p>
          <p className="mt-1 text-2xl font-bold">{shop.stats.orderCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Products online</p>
          <p className="mt-1 text-2xl font-bold">{shop.stats.activeProductCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">All products</p>
          <p className="mt-1 text-2xl font-bold">{shop.stats.productCount}</p>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-medium text-gray-700">Your Order Now link</p>
        <code className="mt-2 block truncate rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-emerald-700">
          {urls.orderLink}
        </code>
        {!isLive && (
          <p className="mt-2 text-xs text-amber-700">
            Link goes live after you activate your shop (add a product + verify email first).
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
    </div>
  );
}
