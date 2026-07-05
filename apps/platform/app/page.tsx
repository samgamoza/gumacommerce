import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CreditCard,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getPlatformStats,
  getRevenueSeries,
  getSignupSeries,
  listAuditLog,
  listTenants,
} from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import {
  AreaChart,
  BarMeter,
  Panel,
  PlanBadge,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/ui";
import { formatMoney, formatNumber, timeAgo } from "@/lib/format";

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#0ea5e9",
  growth: "#8b5cf6",
  pro: "#f59e0b",
};

export default async function DashboardPage() {
  const session = await requireSuperAdmin();
  const [stats, revenue, signups, recentTenants, activity] = await Promise.all([
    getPlatformStats(),
    getRevenueSeries(30),
    getSignupSeries(30),
    listTenants(),
    listAuditLog(6),
  ]);

  const totalSignups = signups.reduce((s, p) => s + p.value, 0);

  return (
    <PlatformShell
      title="Dashboard"
      subtitle="Platform-wide overview"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Monthly recurring revenue"
            value={formatMoney(stats.mrr)}
            sub={`${stats.paidTenantCount} paying shops`}
            icon={<Banknote className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="Gross merchandise value"
            value={formatMoney(stats.gmv)}
            sub={`${formatNumber(stats.orderCount)} paid orders`}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="sky"
          />
          <StatCard
            label="Shops"
            value={formatNumber(stats.tenantCount)}
            sub={
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-3 w-3" />+{stats.newTenants30d} in 30 days
              </span>
            }
            icon={<Store className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            label="Users"
            value={formatNumber(stats.userCount)}
            sub={`${formatNumber(stats.sellerCount)} sellers`}
            icon={<Users className="h-5 w-5" />}
            tone="amber"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <SectionHeader title="Revenue (30 days)" />
            <p className="font-display text-2xl font-bold tracking-tight">
              {formatMoney(revenue.reduce((s, p) => s + p.value, 0))}
            </p>
            <p className="text-xs text-muted-foreground">Paid order value across all shops</p>
            <div className="mt-4">
              <AreaChart points={revenue.map((p) => p.value)} />
            </div>
          </Panel>
          <Panel>
            <SectionHeader title="New shops (30 days)" />
            <p className="font-display text-2xl font-bold tracking-tight">
              {formatNumber(totalSignups)}
            </p>
            <p className="text-xs text-muted-foreground">Shop signups per day</p>
            <div className="mt-4">
              <AreaChart
                points={signups.map((p) => p.value)}
                stroke="hsl(38 92% 50%)"
                fill="hsl(38 92% 50% / 0.12)"
              />
            </div>
          </Panel>
        </div>

        {/* Plan distribution + shop status */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <SectionHeader
              title="Plan distribution"
              action={
                <Link
                  href="/subscriptions"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Manage
                </Link>
              }
            />
            <BarMeter
              segments={stats.planDistribution.map((p) => ({
                label: p.plan,
                value: p.count,
                color: PLAN_COLORS[p.plan] ?? "#94a3b8",
              }))}
            />
          </Panel>
          <Panel>
            <SectionHeader title="Shop status" />
            <BarMeter
              segments={[
                { label: "active", value: stats.activeTenantCount, color: "#10b981" },
                { label: "pending", value: stats.pendingTenantCount, color: "#f59e0b" },
                { label: "suspended", value: stats.suspendedTenantCount, color: "#f43f5e" },
              ]}
            />
          </Panel>
        </div>

        {/* Recent tenants + activity */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel>
              <SectionHeader
                title="Newest shops"
                action={
                  <Link
                    href="/tenants"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    All tenants <ArrowUpRight className="h-3 w-3" />
                  </Link>
                }
              />
              <div className="divide-y divide-border">
                {recentTenants.slice(0, 6).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tenants/${t.id}`}
                    className="flex items-center gap-3 py-3 transition hover:opacity-80"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.ownerEmail ?? "—"}
                      </p>
                    </div>
                    <PlanBadge plan={t.plan} />
                    <StatusPill status={t.status} />
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
          <Panel>
            <SectionHeader
              title="Recent actions"
              action={
                <Link href="/audit" className="text-xs font-semibold text-primary hover:underline">
                  View log
                </Link>
              }
            />
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No admin actions yet.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-medium">{a.action.replace(/_/g, " ")}</span>{" "}
                        <span className="text-muted-foreground">{a.entityLabel ?? a.entityType}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </PlatformShell>
  );
}
