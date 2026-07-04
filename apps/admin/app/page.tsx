import { AdminShell } from "@/components/admin-shell";
import { DashboardView } from "@/components/dashboard-view";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <AdminShell title="Dashboard">
      <DashboardView displayName={session?.displayName ?? "Seller"} />
    </AdminShell>
  );
}
