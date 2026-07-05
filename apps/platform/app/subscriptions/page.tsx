import Link from "next/link";
import { Banknote, TrendingUp, Users, Wallet } from "lucide-react";
import { PLATFORM_PLANS, getPlatformStats, listTenants, planPrice } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { PlanSelect } from "@/components/plan-select";
import { Panel, PlanBadge, SectionHeader, StatCard, StatusPill } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";

export default async function SubscriptionsPage() {
  const session = await requireSuperAdmin();
  const [stats, tenants] = await Promise.all([getPlatformStats(), listTenants()]);

  const planCountMap = new Map(stats.planDistribution.map((p) => [p.plan, p.count]));
  const arpu = stats.paidTenantCount > 0 ? stats.mrr / stats.paidTenantCount : 0;
  const arr = stats.mrr * 12;

  return (
    <PlatformShell
      title="Subscriptions"
      subtitle="Plans, revenue, and billing tiers"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="MRR"
            value={formatMoney(stats.mrr)}
            sub="Monthly recurring revenue"
            icon={<Banknote className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="ARR"
            value={formatMoney(arr)}
            sub="Annualized"
            icon={<TrendingUp className="h-5 w-5" />}
            tone="sky"
          />
          <StatCard
            label="Paying shops"
            value={formatNumber(stats.paidTenantCount)}
            sub={`of ${formatNumber(stats.tenantCount)} total`}
            icon={<Users className="h-5 w-5" />}
            tone="violet"
          />
          <StatCard
            label="ARPU"
            value={formatMoney(arpu)}
            sub="Avg revenue / paying shop"
            icon={<Wallet className="h-5 w-5" />}
            tone="amber"
          />
        </div>

        {/* Plan catalog */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLATFORM_PLANS.map((plan) => {
            const count = planCountMap.get(plan.id) ?? 0;
            const mrr = plan.priceMonthly * count;
            return (
              <Panel key={plan.id}>
                <div className="flex items-center justify-between">
                  <PlanBadge plan={plan.id} />
                  <span className="text-xs text-muted-foreground">{plan.tagline}</span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold tracking-tight">
                  {plan.priceMonthly === 0 ? "Free" : formatMoney(plan.priceMonthly)}
                  {plan.priceMonthly > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  )}
                </p>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{count} shops</span>
                  <span className="font-semibold">{formatMoney(mrr)} MRR</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>

        {/* Per-tenant plan management */}
        <Panel className="!p-0">
          <div className="p-5 pb-0">
            <SectionHeader title="Manage shop plans" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Shop</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Current plan</th>
                  <th className="px-5 py-3 text-right font-semibold">Monthly</th>
                  <th className="px-5 py-3 text-right font-semibold">Change plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((t) => (
                  <tr key={t.id} className="transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link
                        href={`/tenants/${t.id}`}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {t.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">/{t.slug}</p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="px-5 py-3">
                      <PlanBadge plan={t.plan} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">
                      {formatMoney(planPrice(t.plan))}
                    </td>
                    <td className="px-5 py-3">
                      <PlanSelect tenantId={t.id} name={t.name} plan={t.plan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </PlatformShell>
  );
}
