import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { DashboardView } from "@/components/dashboard-view";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <PatternAdminShell
      title="Overview"
      description="Your shop at a glance — sales, setup, and every workspace module."
    >
      <DashboardView displayName={session?.displayName ?? "Seller"} />
    </PatternAdminShell>
  );
}
