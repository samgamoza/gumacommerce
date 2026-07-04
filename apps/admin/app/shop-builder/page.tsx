import { AdminShell } from "@/components/admin-shell";
import { ShopBuilder } from "@/components/shop-builder";

export default function ShopBuilderPage() {
  return (
    <AdminShell title="Shop Builder">
      <ShopBuilder />
    </AdminShell>
  );
}
