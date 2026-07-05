import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { listPlatformOrders } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { FilterBar } from "@/components/filter-bar";
import { EmptyState, Panel, StatCard, StatusPill } from "@/components/ui";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
];

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await requireSuperAdmin();
  const filters = await searchParams;
  const orders = await listPlatformOrders(filters);

  const grossValue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <PlatformShell
      title="Orders"
      subtitle="All orders across every shop"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Orders shown"
          value={formatNumber(orders.length)}
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard label="Value shown" value={formatMoney(grossValue)} tone="emerald" />
      </div>

      <FilterBar
        basePath="/orders"
        searchPlaceholder="Search by order number…"
        selects={[
          {
            name: "status",
            label: "All statuses",
            options: ORDER_STATUSES.map((s) => ({
              value: s,
              label: s.replace(/_/g, " "),
            })),
          },
        ]}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-5 w-5" />}
          title="No orders match your filters"
          hint="Orders placed in any shop will appear here."
        />
      ) : (
        <Panel className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Shop</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-muted/40">
                    <td className="px-5 py-3 font-semibold">#{o.orderNumber}</td>
                    <td className="px-5 py-3">
                      {o.tenantSlug ? (
                        <Link
                          href={`/tenants?search=${o.tenantSlug}`}
                          className="text-muted-foreground hover:text-primary hover:underline"
                        >
                          {o.tenantName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{o.customerName ?? "Guest"}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-5 py-3">
                      {o.paymentStatus ? <StatusPill status={o.paymentStatus} /> : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">
                      {formatMoney(o.total)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </PlatformShell>
  );
}
