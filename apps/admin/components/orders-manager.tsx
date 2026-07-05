"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, formatPrice } from "@guma-commerce/ui";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  deliveryType: string;
  total: string;
  itemsSummary: string;
  itemCount: number;
  createdAt: string;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New", statuses: ["pending_payment", "paid", "accepted"] },
  { id: "preparing", label: "Preparing", statuses: ["preparing", "ready_for_pickup"] },
  { id: "delivering", label: "Delivering", statuses: ["out_for_delivery"] },
  { id: "completed", label: "Completed", statuses: ["delivered"] },
  { id: "cancelled", label: "Cancelled", statuses: ["cancelled", "refunded"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** The one-tap "next step" for each status, per fulfillment type. */
function nextAction(order: OrderRow): { label: string; status: OrderStatus } | null {
  const isPickup = order.deliveryType === "pickup";
  switch (order.status) {
    case "paid":
      return { label: "Accept order", status: "accepted" };
    case "accepted":
      return { label: "Start preparing", status: "preparing" };
    case "preparing":
      return isPickup
        ? { label: "Ready for pickup", status: "ready_for_pickup" }
        : { label: "Out for delivery", status: "out_for_delivery" };
    case "ready_for_pickup":
      return { label: "Mark picked up", status: "delivered" };
    case "out_for_delivery":
      return { label: "Mark delivered", status: "delivered" };
    default:
      return null;
  }
}

function canCancel(status: OrderStatus): boolean {
  return ["pending_payment", "paid", "accepted", "preparing"].includes(status);
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-gray-100 text-gray-600",
  paid: "bg-blue-50 text-blue-700",
  accepted: "bg-violet-50 text-violet-700",
  preparing: "bg-amber-50 text-amber-700",
  ready_for_pickup: "bg-cyan-50 text-cyan-700",
  out_for_delivery: "bg-orange-50 text-orange-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  refunded: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid — action needed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function OrdersManager() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders);
        setError(null);
      } else {
        setError(data.error ?? "Could not load orders.");
      }
    } catch {
      setError("Could not load orders. Check your connection.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), 30_000);
    return () => window.clearInterval(interval);
  }, [load]);

  async function updateStatus(order: OrderRow, status: OrderStatus, note?: string) {
    setUpdatingId(order.id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not update the order.");
        return;
      }
      setOrders((current) =>
        current.map((row) => (row.id === order.id ? { ...row, status } : row))
      );
    } catch {
      setError("Network error while updating the order.");
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = useMemo(() => {
    const map = new Map<TabId, number>();
    for (const tabDef of TABS) {
      if (tabDef.id === "all") {
        map.set(tabDef.id, orders.length);
      } else {
        map.set(
          tabDef.id,
          orders.filter((order) => (tabDef.statuses as readonly string[]).includes(order.status))
            .length
        );
      }
    }
    return map;
  }, [orders]);

  const visible = useMemo(() => {
    const tabDef = TABS.find((t) => t.id === tab);
    if (!tabDef || tab === "all") return orders;
    return orders.filter((order) =>
      ((tabDef as { statuses?: readonly string[] }).statuses ?? []).includes(order.status)
    );
  }, [orders, tab]);

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((tabDef) => {
          const count = counts.get(tabDef.id) ?? 0;
          if (tabDef.id === "cancelled" && count === 0) return null;
          return (
            <button
              key={tabDef.id}
              onClick={() => setTab(tabDef.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === tabDef.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {tabDef.label}
              {count > 0 && tabDef.id !== "all" && (
                <span className="ml-1.5 rounded-full bg-black/10 px-1.5 text-xs">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <p className="text-gray-500">Loading orders...</p>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="text-center">
          <div className="text-4xl">🧾</div>
          <h2 className="mt-3 font-semibold">
            {orders.length === 0 ? "No orders yet" : "Nothing here"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            {orders.length === 0
              ? "Share your shop link on Facebook, TikTok, or Instagram — new orders will appear here the moment a customer checks out."
              : "No orders in this tab right now."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const action = nextAction(order);
            return (
              <Card key={order.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{order.customerName}</p>
                      <span className="text-xs text-gray-400">
                        · {relativeTime(order.createdAt)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {order.orderNumber} ·{" "}
                      <a href={`tel:${order.customerPhone}`} className="hover:text-emerald-700">
                        {order.customerPhone}
                      </a>{" "}
                      · {order.deliveryType === "pickup" ? "Pickup" : "Delivery"} ·{" "}
                      {order.paymentMethod.toUpperCase()}
                      {order.paymentMethod === "cod" && order.paymentStatus !== "paid"
                        ? " (collect on delivery)"
                        : ""}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-gray-600">{order.itemsSummary}</p>
                    <p className="mt-1 font-bold text-emerald-700">
                      {formatPrice(Number(order.total))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canCancel(order.status) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel order ${order.orderNumber}?`)) {
                            updateStatus(order, "cancelled", "Cancelled by seller");
                          }
                        }}
                        disabled={updatingId === order.id}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                    {action && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order, action.status)}
                        disabled={updatingId === order.id}
                      >
                        {updatingId === order.id ? "Saving..." : action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
