"use client";

import { AdminShell } from "@/components/admin-shell";
import { SweetDashboardShell, useTenantPattern } from "@/components/sweet-dashboard-shell";

export function PatternAdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { patternId, loading } = useTenantPattern();

  if (loading) {
    return (
      <AdminShell title={title} description={description}>
        <p className="text-sm text-gray-500">Loading workspace…</p>
      </AdminShell>
    );
  }

  if (patternId === "simply-sweet") {
    return (
      <SweetDashboardShell title={title} description={description}>
        {children}
      </SweetDashboardShell>
    );
  }

  return (
    <AdminShell title={title} description={description}>
      {children}
    </AdminShell>
  );
}
