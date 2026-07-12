import { redirect } from "next/navigation";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { DashboardView } from "@/components/dashboard-view";
import { getSession } from "@/lib/session";
import { needsGumaLaunch, getLaunchTenantState } from "@guma-commerce/db";

export default async function DashboardPage() {
  const session = await getSession();

  if (session?.tenantId) {
    const state = await getLaunchTenantState(session.tenantId);
    if (needsGumaLaunch(state)) {
      redirect("/launch");
    }
  }

  return (
    <PatternAdminShell
      title="Overview"
      description="Your shop at a glance — sales, setup, and every workspace module."
    >
      <DashboardView displayName={session?.displayName ?? "Seller"} />
    </PatternAdminShell>
  );
}
