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
  paymentReference?: string | null;
  paymentProofUrl?: string | null;
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
    case "pending_payment":
      return null; // confirmed via confirmPayment(), not status patch
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
  pending_payment: "bg-muted text-muted-foreground",
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
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [assignOrder, setAssignOrder] = useState<OrderRow | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignForm, setAssignForm] = useState({
    courierLabel: "Angkas",
    driverName: "",
    driverPhone: "",
    driverPlateNumber: "",
    trackingUrl: "",
  });

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

  async function bookRider(order: OrderRow) {
    setBookingId(order.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/book-delivery`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not book a rider.");
        return;
      }
      setBookedIds((current) => new Set(current).add(order.id));
      const provider = data.delivery.provider ? String(data.delivery.provider) : "courier";
      setNotice(
        data.delivery.trackingUrl
          ? `${provider} rider booked for ${order.orderNumber} (₱${data.delivery.fee}). Track: ${data.delivery.trackingUrl}`
          : `${provider} rider booked for ${order.orderNumber} (₱${data.delivery.fee}).`
      );
    } catch {
      setError("Network error while booking the rider.");
    } finally {
      setBookingId(null);
    }
  }

  async function submitAssignRider() {
    if (!assignOrder) return;
    setAssignSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${assignOrder.id}/assign-rider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not save rider.");
        return;
      }
      setBookedIds((current) => new Set(current).add(assignOrder.id));
      setNotice(
        `Rider ${assignForm.driverName} assigned on ${assignOrder.orderNumber} (${assignForm.courierLabel}).`
      );
      setAssignOrder(null);
    } catch {
      setError("Network error while saving rider details.");
    } finally {
      setAssignSaving(false);
    }
  }

  async function confirmPayment(order: OrderRow) {
    const confirmed = window.confirm(
      `Confirm that you received ${formatPrice(Number(order.total))} for ${order.orderNumber} via ${order.paymentMethod.toUpperCase()}?`
    );
    if (!confirmed) return;

    setUpdatingId(order.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not confirm payment.");
        return;
      }
      setOrders((current) =>
        current.map((row) =>
          row.id === order.id
            ? { ...row, status: "paid", paymentStatus: "paid" }
            : row
        )
      );
      setNotice(`Payment confirmed for ${order.orderNumber}.`);
    } catch {
      setError("Network error while confirming payment.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function refundOrder(order: OrderRow) {
    const confirmed = window.confirm(
      `Refund order ${order.orderNumber} (${formatPrice(Number(order.total))})?` +
        (order.paymentMethod === "cod"
          ? "\n\nCOD order — you'll need to return the cash to the customer yourself."
          : "\n\nThe amount will be refunded through PayMongo.")
    );
    if (!confirmed) return;

    setUpdatingId(order.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Refund failed.");
        return;
      }
      setOrders((current) =>
        current.map((row) =>
          row.id === order.id ? { ...row, status: "refunded", paymentStatus: "refunded" } : row
        )
      );
      setNotice(`Order ${order.orderNumber} refunded.`);
    } catch {
      setError("Network error while refunding the order.");
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
                  : "bg-card text-muted-foreground ring-1 ring-gray-200 hover:bg-muted"
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
      {notice && (
        <div className="mb-4 break-all rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {loading ? (
        <Card>
          <p className="text-muted-foreground">Loading orders...</p>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="text-center">
          <div className="text-4xl">🧾</div>
          <h2 className="mt-3 font-semibold">
            {orders.length === 0 ? "No orders yet" : "Nothing here"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
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
                      <span className="text-xs text-muted-foreground">
                        · {relativeTime(order.createdAt)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
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
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{order.itemsSummary}</p>
                    {(order.paymentReference || order.paymentProofUrl) &&
                      order.status === "pending_payment" && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                          {order.paymentReference ? (
                            <p>
                              Ref: <span className="font-semibold">{order.paymentReference}</span>
                            </p>
                          ) : null}
                          {order.paymentProofUrl ? (
                            <a
                              href={order.paymentProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block font-medium text-emerald-700 underline"
                            >
                              View payment screenshot
                            </a>
                          ) : null}
                        </div>
                      )}
                    <p className="mt-1 font-bold text-emerald-700">
                      {formatPrice(Number(order.total))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {order.status === "pending_payment" &&
                      order.paymentMethod !== "cod" && (
                        <button
                          onClick={() => confirmPayment(order)}
                          disabled={updatingId === order.id}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {updatingId === order.id ? "Confirming…" : "Confirm payment"}
                        </button>
                      )}
                    {order.deliveryType === "delivery" &&
                      ["paid", "accepted", "preparing", "ready_for_pickup"].includes(
                        order.status
                      ) &&
                      !bookedIds.has(order.id) && (
                        <>
                          <button
                            onClick={() => bookRider(order)}
                            disabled={bookingId === order.id}
                            className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
                          >
                            {bookingId === order.id ? "Booking…" : "Book courier"}
                          </button>
                          <button
                            onClick={() => {
                              setAssignOrder(order);
                              setAssignForm({
                                courierLabel: "Angkas",
                                driverName: "",
                                driverPhone: "",
                                driverPlateNumber: "",
                                trackingUrl: "",
                              });
                            }}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                          >
                            Assign rider
                          </button>
                        </>
                      )}
                    {canCancel(order.status) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel order ${order.orderNumber}?`)) {
                            updateStatus(order, "cancelled", "Cancelled by seller");
                          }
                        }}
                        disabled={updatingId === order.id}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                    {order.paymentStatus === "paid" &&
                      !["cancelled", "refunded"].includes(order.status) && (
                        <button
                          onClick={() => refundOrder(order)}
                          disabled={updatingId === order.id}
                          className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          Refund
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

      {assignOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-xl">
            <h3 className="font-display text-lg font-bold">Assign rider</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              For Angkas, Move It, Grab booked outside the app, or your own rider —{" "}
              {assignOrder.orderNumber}.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Courier
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm"
                  value={assignForm.courierLabel}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, courierLabel: e.target.value }))
                  }
                >
                  <option>Angkas</option>
                  <option>Move It</option>
                  <option>Grab (manual)</option>
                  <option>Lalamove (manual)</option>
                  <option>Own rider</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Rider name
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm"
                  value={assignForm.driverName}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, driverName: e.target.value }))
                  }
                  placeholder="Juan D."
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Rider phone
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm"
                  value={assignForm.driverPhone}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, driverPhone: e.target.value }))
                  }
                  placeholder="09XXXXXXXXX"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Plate (optional)
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm"
                  value={assignForm.driverPlateNumber}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, driverPlateNumber: e.target.value }))
                  }
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Tracking link (optional)
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm"
                  value={assignForm.trackingUrl}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, trackingUrl: e.target.value }))
                  }
                  placeholder="https://"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                onClick={() => setAssignOrder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assignSaving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                onClick={() => submitAssignRider()}
              >
                {assignSaving ? "Saving…" : "Save rider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
