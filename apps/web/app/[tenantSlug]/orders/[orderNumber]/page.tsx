import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForTracking, type OrderStatus } from "@guma-commerce/db";
import { Badge, Button, Card } from "@guma-commerce/ui";
import { getTenant as getDemoTenant } from "@/lib/demo-data";

interface PageProps {
  params: Promise<{ tenantSlug: string; orderNumber: string }>;
}

function formatPrice(amount: string | number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash",
  paymaya: "Maya",
  qrph: "QR Ph",
  card: "Card",
  cod: "Cash on Delivery",
};

function buildTimeline(status: OrderStatus, deliveryType: string, paymentMethod: string) {
  const isPickup = deliveryType === "pickup";
  const isCod = paymentMethod === "cod";

  const steps: Array<{ key: OrderStatus | "placed"; label: string }> = [
    { key: "placed", label: "Order placed" },
    ...(isCod ? [] : [{ key: "paid" as const, label: "Payment confirmed" }]),
    { key: "accepted", label: "Order accepted" },
    { key: "preparing", label: "Preparing your order" },
    ...(isPickup
      ? [{ key: "ready_for_pickup" as const, label: "Ready for pickup" }]
      : [{ key: "out_for_delivery" as const, label: "Out for delivery" }]),
    { key: "delivered", label: isPickup ? "Picked up" : "Delivered" },
  ];

  const statusRank: Record<string, number> = {
    pending_payment: 0,
    paid: 1,
    accepted: 2,
    preparing: 3,
    ready_for_pickup: 4,
    out_for_delivery: 4,
    delivered: 5,
  };
  const stepRank: Record<string, number> = {
    placed: 0,
    paid: 1,
    accepted: 2,
    preparing: 3,
    ready_for_pickup: 4,
    out_for_delivery: 4,
    delivered: 5,
  };

  const currentRank = statusRank[status] ?? 0;
  return steps.map((step) => {
    const rank = stepRank[step.key] ?? 0;
    return {
      label: step.label,
      done: rank <= currentRank,
      active: rank === currentRank + 1 || (rank === currentRank && status !== "delivered"),
    };
  });
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { tenantSlug, orderNumber } = await params;

  // Demo shops show a simulated order instead of hitting the database.
  const demoTenant = getDemoTenant(tenantSlug);
  const order = demoTenant ? null : await getOrderForTracking(tenantSlug, orderNumber);

  if (!order && !demoTenant) notFound();

  const status: OrderStatus = order?.status ?? "accepted";
  const isCancelled = status === "cancelled" || status === "refunded";
  const timeline = buildTimeline(
    status,
    order?.deliveryType ?? "delivery",
    order?.paymentMethod ?? "cod"
  );
  const awaitingPayment = status === "pending_payment";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <Card className="text-center">
          <div className="text-4xl">{isCancelled ? "❌" : awaitingPayment ? "⏳" : "✅"}</div>
          <h1 className="mt-3 text-xl font-bold">
            {isCancelled
              ? "Order cancelled"
              : awaitingPayment
                ? "Waiting for payment"
                : "Order confirmed!"}
          </h1>
          <p className="mt-1 text-gray-500">Order #{orderNumber}</p>
          {order && (
            <p className="mt-1 text-sm text-gray-400">
              {order.tenantName} · {formatTime(order.createdAt)}
            </p>
          )}
          {!isCancelled && <Badge className="mt-3">SMS updates sent to your phone</Badge>}
          {awaitingPayment && (
            <p className="mx-auto mt-3 max-w-xs text-sm text-amber-700">
              Complete your {PAYMENT_LABELS[order?.paymentMethod ?? ""] ?? "online"} payment to
              start the order. This page updates once payment is confirmed.
            </p>
          )}
        </Card>

        {!isCancelled && (
          <Card>
            <h2 className="font-semibold">
              {order?.deliveryType === "pickup" ? "Pickup status" : "Delivery status"}
            </h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((step) => (
                <li key={step.label} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                      step.done
                        ? "bg-emerald-600 text-white"
                        : step.active
                          ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.done ? "✓" : "·"}
                  </div>
                  <span className={step.done || step.active ? "font-medium" : "text-gray-400"}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {order && (
          <Card>
            <h2 className="font-semibold">Order details</h2>
            <div className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={`${item.title}-${item.quantity}`} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.quantity}× {item.title}
                  </span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-gray-600">
                <span>Delivery fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold">
                <span>Total</span>
                <span className="text-emerald-700">{formatPrice(order.total)}</span>
              </div>
              <p className="pt-1 text-xs text-gray-400">
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} ·{" "}
                {order.paymentStatus === "paid"
                  ? "Paid"
                  : order.paymentMethod === "cod"
                    ? "Pay on delivery"
                    : "Payment pending"}
              </p>
            </div>
          </Card>
        )}

        {order && order.history.length > 0 && (
          <Card>
            <h2 className="font-semibold">History</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[...order.history].reverse().map((entry, index) => (
                <li key={index} className="flex justify-between gap-3">
                  <span className="capitalize text-gray-700">
                    {entry.status.replace(/_/g, " ")}
                    {entry.note ? (
                      <span className="block text-xs text-gray-400">{entry.note}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {demoTenant && (
          <Card>
            <p className="text-sm text-gray-500">Estimated delivery</p>
            <p className="text-lg font-bold">35–45 minutes</p>
            <p className="mt-2 text-sm text-emerald-700">Demo order — no payment was processed</p>
          </Card>
        )}

        <Link href={`/${tenantSlug}`}>
          <Button variant="secondary" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
