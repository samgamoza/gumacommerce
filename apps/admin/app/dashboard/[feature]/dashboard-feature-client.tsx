"use client";

import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { PlanGatedPage } from "@/components/plan/plan-gated-page";
import { useTenantPlan } from "@/components/plan/use-tenant-plan";
import { DASHBOARD_FEATURES } from "@/lib/dashboard-features";

export function DashboardFeatureClient({ featureId }: { featureId: string }) {
  const meta = DASHBOARD_FEATURES[featureId];
  const { plan, loading } = useTenantPlan();

  if (!meta) {
    return (
      <PatternAdminShell title="Not found">
        <p className="text-sm text-gray-500">This dashboard section does not exist.</p>
      </PatternAdminShell>
    );
  }

  return (
    <PatternAdminShell title={meta.title} description={meta.description}>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <PlanGatedPage
          title={meta.title}
          description={meta.description}
          requiredPlan={meta.minPlan}
          currentPlan={plan}
          previewCards={meta.previewCards}
          refSource={`dashboard-${featureId}`}
        />
      )}
    </PatternAdminShell>
  );
}
