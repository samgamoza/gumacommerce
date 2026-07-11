import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { CategoriesManager } from "@/components/categories-manager";

export default function CategoriesPage() {
  return (
    <PatternAdminShell title="Categories">
      <CategoriesManager />
    </PatternAdminShell>
  );
}
