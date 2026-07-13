"use client";

import Link from "next/link";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { planAtLeast, upgradeHref } from "@/lib/plan-access";
import { useTenantPlan } from "@/components/plan/use-tenant-plan";
import { PlanTierBadge } from "@/components/plan/plan-tier-badge";

export function DashboardModulesGrid() {
  const { plan, loading } = useTenantPlan();

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />;
  }

  const modules = DASHBOARD_NAV.flatMap((g) => g.items).filter(
    (item) => item.id !== "overview" && !item.href.startsWith("/settings")
  );

  return (
    <div>
      <h3 className="font-display text-lg font-bold text-gray-900">Workspace modules</h3>
      <p className="mt-1 text-sm text-gray-500">
        Explore everything in your seller dashboard. Locked items require a plan upgrade.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => {
          const locked = item.minPlan ? !planAtLeast(plan, item.minPlan) : false;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group relative rounded-xl border bg-white p-4 transition hover:shadow-md ${
                locked ? "border-gray-100 opacity-90" : "border-gray-200 hover:border-emerald-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    locked ? "bg-gray-100 text-gray-400" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex gap-1">
                  {item.badge === "new" ? (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">
                      New
                    </span>
                  ) : null}
                  {locked && item.minPlan ? <PlanTierBadge tier={item.minPlan} /> : null}
                </div>
              </div>
              <p className="mt-3 font-semibold text-gray-900">{item.label}</p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description}</p>
              {locked && item.minPlan ? (
                <p className="mt-2 text-[11px] font-medium text-amber-700">
                  Upgrade to unlock →
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>

      {plan !== "pro" ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Unlock Pro &amp; Advance features
            </p>
            <p className="text-xs text-amber-800/80">
              Analytics, integrations, workflows, API access, and more.
            </p>
          </div>
          <Link
            href={upgradeHref(plan === "free" ? "growth" : "pro", "overview-banner")}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white"
          >
            View plans
          </Link>
        </div>
      ) : null}
    </div>
  );
}
