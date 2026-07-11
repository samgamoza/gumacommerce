import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { ProductsManager } from "@/components/products-manager";

export default function ProductsPage() {
  return (
    <PatternAdminShell title="Products">
      <ProductsManager />
    </PatternAdminShell>
  );
}
