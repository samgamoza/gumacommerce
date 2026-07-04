import { AdminShell } from "@/components/admin-shell";
import { ProductsManager } from "@/components/products-manager";

export default function ProductsPage() {
  return (
    <AdminShell title="Products">
      <ProductsManager />
    </AdminShell>
  );
}
