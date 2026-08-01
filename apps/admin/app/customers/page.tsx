import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { CustomersManager } from "@/components/customers-manager";

export default function CustomersPage() {
  return (
    <PatternAdminShell title="Customers">
      <CustomersManager />
    </PatternAdminShell>
  );
}
