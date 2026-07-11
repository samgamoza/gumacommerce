import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { OrdersManager } from "@/components/orders-manager";

export default function OrdersPage() {
  return (
    <PatternAdminShell title="Orders">
      <OrdersManager />
    </PatternAdminShell>
  );
}
