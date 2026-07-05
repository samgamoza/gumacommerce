import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, PackageCheck, ShoppingCart, Wallet } from "lucide-react";
import { getTenantDetail } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { TenantActions } from "@/components/tenant-actions";
import {
  EmptyState,
  Panel,
  PlanBadge,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/ui";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: PageProps) {
  const session = await requireSuperAdmin();
  const { id } = await params;
  const tenant = await getTenantDetail(id);
  if (!tenant) notFound();

  const shopUrl = `${STOREFRONT_URL}/${tenant.slug}`;

  return (
    <PlatformShell
      title={tenant.name}
      subtitle={`/${tenant.slug}`}
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="space-y-6">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tenants
        </Link>

        {/* Header card */}
        <Panel className="relative overflow-hidden">
          <div className="absolute inset-0 hero-glow opacity-50" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-xl font-bold text-muted-foreground">
                {tenant.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold tracking-tight">{tenant.name}</h2>
                  <StatusPill status={tenant.status} />
                  <PlanBadge plan={tenant.plan} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tenant.category ?? "General"} · Joined {formatDate(tenant.createdAt)} ·{" "}
                  {tenant.currency} · {tenant.timezone}
                </p>
                {tenant.ownerEmail && (
                  <p className="text-sm text-muted-foreground">
                    Owner: <span className="text-foreground">{tenant.ownerName ?? tenant.ownerEmail}</span>{" "}
                    ({tenant.ownerEmail})
                  </p>
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="GMV"
            value={formatMoney(tenant.gmv)}
            icon={<Wallet className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="Orders"
            value={tenant.orderCount}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="sky"
          />
          <StatCard
            label="Products live"
            value={tenant.activeProductCount}
            icon={<PackageCheck className="h-5 w-5" />}
            tone="amber"
          />
          <StatCard
            label="All products"
            value={tenant.productCount}
            icon={<Package className="h-5 w-5" />}
            tone="violet"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: orders + staff */}
          <div className="space-y-6 lg:col-span-2">
            <Panel>
              <SectionHeader title="Recent orders" />
              {tenant.recentOrders.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="h-5 w-5" />}
                  title="No orders yet"
                  hint="This shop hasn't received any orders."
                />
              ) : (
                <div className="divide-y divide-border">
                  {tenant.recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">#{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(o.createdAt)}
                        </p>
                      </div>
                      <StatusPill status={o.status} />
                      <p className="w-24 text-right font-medium tabular-nums">
                        {formatMoney(o.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel>
              <SectionHeader title={`Team (${tenant.staff.length})`} />
              <div className="divide-y divide-border">
                {tenant.staff.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.name ?? s.email ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                        {s.role.replace(/_/g, " ")}
                      </span>
                      <StatusPill status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Right: admin actions */}
          <div>
            <Panel>
              <SectionHeader title="Admin actions" />
              <TenantActions
                tenantId={tenant.id}
                name={tenant.name}
                status={tenant.status}
                plan={tenant.plan}
                shopUrl={shopUrl}
              />
            </Panel>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
