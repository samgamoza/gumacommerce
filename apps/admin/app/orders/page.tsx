import { AdminShell } from "@/components/admin-shell";
import { Button, Card, formatPrice } from "@guma-commerce/ui";

const ORDERS = [
  {
    id: "DEMO-20260703-4821",
    customer: "Maria Santos",
    phone: "09171234567",
    total: 238,
    status: "preparing",
    channel: "instagram",
    time: "2 min ago",
  },
  {
    id: "DEMO-20260703-4819",
    customer: "Juan Dela Cruz",
    phone: "09181234567",
    total: 149,
    status: "out_for_delivery",
    channel: "tiktok",
    time: "18 min ago",
  },
  {
    id: "DEMO-20260703-4815",
    customer: "Anna Lopez",
    phone: "09191234567",
    total: 499,
    status: "delivered",
    channel: "facebook",
    time: "1 hr ago",
  },
];

const STATUS_ACTIONS: Record<string, string> = {
  preparing: "Mark Ready",
  out_for_delivery: "Track Delivery",
  delivered: "View Receipt",
};

export default function OrdersPage() {
  return (
    <AdminShell title="Orders">
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {["All", "New", "Preparing", "Delivering", "Completed"].map((tab, i) => (
          <button
            key={tab}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              i === 0 ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {ORDERS.map((order) => (
          <Card key={order.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{order.customer}</p>
                  <span className="text-xs text-gray-400">· {order.time}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {order.id} · {order.phone} · via {order.channel}
                </p>
                <p className="mt-1 font-bold text-emerald-700">{formatPrice(order.total)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium capitalize text-amber-700">
                  {order.status.replace(/_/g, " ")}
                </span>
                <Button size="sm">{STATUS_ACTIONS[order.status] ?? "View"}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
