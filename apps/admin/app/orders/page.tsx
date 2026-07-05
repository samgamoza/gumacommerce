import { AdminShell } from "@/components/admin-shell";
import { OrdersManager } from "@/components/orders-manager";

export default function OrdersPage() {
  return (
    <AdminShell title="Orders">
      <OrdersManager />
    </AdminShell>
  );
}
