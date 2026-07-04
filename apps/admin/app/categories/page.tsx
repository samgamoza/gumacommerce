import { AdminShell } from "@/components/admin-shell";
import { CategoriesManager } from "@/components/categories-manager";

export default function CategoriesPage() {
  return (
    <AdminShell title="Categories">
      <CategoriesManager />
    </AdminShell>
  );
}
