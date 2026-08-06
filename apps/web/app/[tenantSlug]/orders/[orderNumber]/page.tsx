import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrderForTracking,
  getTenantStorefrontBySlug,
  resolveTenantPaymentsSettings,
  type OrderStatus,
} from "@guma-commerce/db";
import { buildManualEwalletInstructions } from "@guma-commerce/services";
import { Badge, Button, Card } from "@guma-commerce/ui";
import { getTenant as getDemoTenant } from "@/lib/demo-data";
import { OrderAutoRefresh } from "@/components/order-auto-refresh";
import { ManualPaymentPanel } from "@/components/manual-payment-panel";
import { MessageSellerButton } from "@/components/storefront/message-seller-button";
import { resolveStorefrontSettings } from "@/lib/storefront-settings";

export const dynamic = "force-dynamic";

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

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(value);
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
  const tenant = demoTenant ? null : await getTenantStorefrontBySlug(tenantSlug);

  if (!order && !demoTenant) notFound();

  const storeSettings = tenant
    ? resolveStorefrontSettings(
        tenant.settingsJson as Parameters<typeof resolveStorefrontSettings>[0],
        tenant.currency ?? "PHP",
        tenant.checkoutPublishedJson,
        tenant.shippingPublishedJson
      )
    : null;

  const payments = resolveTenantPaymentsSettings(
    (tenant?.settingsJson ?? null) as Record<string, unknown> | null
  );
  const payInstructions =
    order && order.paymentMethod !== "cod"
      ? buildManualEwalletInstructions({
          method:
            order.paymentMethod === "paymaya"
              ? "paymaya"
              : order.paymentMethod === "bank"
                ? "bank"
                : "gcash",
          amount: formatPrice(order.total),
          orderNumber: order.orderNumber,
          receiving: payments.receiving,
        })
      : null;

  const status: OrderStatus = order?.status ?? "accepted";
  const isCancelled = status === "cancelled" || status === "refunded";
  const timeline = buildTimeline(
    status,
    order?.deliveryType ?? "delivery",
    order?.paymentMethod ?? "cod"
  );
  const awaitingPayment = status === "pending_payment";
  const inMotion = !isCancelled && status !== "delivered" && !demoTenant;
  const delivery = order?.delivery ?? null;
  const driverMapUrl =
    delivery?.driverLat && delivery.driverLng
      ? `https://www.google.com/maps?q=${delivery.driverLat},${delivery.driverLng}`
      : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <OrderAutoRefresh active={inMotion} />
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

        {order && payInstructions && storeSettings && awaitingPayment ? (
          <ManualPaymentPanel
            tenantSlug={tenantSlug}
            orderNumber={order.orderNumber}
            paymentMethod={order.paymentMethod}
            totalLabel={formatPrice(order.total)}
            instructions={payInstructions}
            shopAssistant={storeSettings.shopAssistant}
            shopName={order.tenantName}
            alreadyPaid={order.paymentStatus === "paid"}
          />
        ) : null}

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

        {delivery && !isCancelled && (
          <Card>
            <h2 className="font-semibold">Your rider</h2>
            {delivery.driverName ? (
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-medium">
                  {delivery.driverName}
                  {delivery.driverPlateNumber ? ` · ${delivery.driverPlateNumber}` : ""}
                </p>
                {delivery.driverPhone && (
                  <a href={`tel:${delivery.driverPhone}`} className="block text-emerald-700">
                    {delivery.driverPhone}
                  </a>
                )}
                {delivery.driverLocationAt && driverMapUrl && (
                  <p className="text-gray-500">
                    Last seen {formatTime(delivery.driverLocationAt)} ·{" "}
                    <a
                      href={driverMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline"
                    >
                      View live location
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Finding a rider for your order… this usually takes a few minutes.
              </p>
            )}
            {delivery.trackingUrl && (
              <a
                href={delivery.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Track rider on {delivery.provider === "lalamove" ? "Lalamove" : "the map"}
              </a>
            )}
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

        {order && Array.isArray(order.history) && order.history.length > 0 && (
          <Card>
            <h2 className="font-semibold">History</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[...order.history].reverse().map((entry, index) => (
                <li key={index} className="flex justify-between gap-3">
                  <span className="capitalize text-gray-700">
                    {String(entry.status).replace(/_/g, " ")}
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

        {order && storeSettings && !isCancelled ? (
          <Card className="space-y-2">
            <h2 className="font-semibold">Need help with this order?</h2>
            <p className="text-sm text-gray-500">
              Message the shop about payment proof, changes, or delivery — they reply in this
              chat.
            </p>
            <MessageSellerButton
              tenantSlug={tenantSlug}
              shopName={order.tenantName}
              assistant={
                storeSettings.shopAssistant ?? {
                  enabled: true,
                  name: "Shop chat",
                  greeting: "Hi! How can we help with your order?",
                  tone: "friendly_taglish",
                  humanInbox: true,
                }
              }
              orderNumber={order.orderNumber}
              whatsapp={storeSettings.whatsapp}
              className="w-full justify-center rounded-xl border border-neutral-200 bg-white py-3 text-sm font-semibold"
            />
          </Card>
        ) : null}

        <Link href={`/${tenantSlug}`}>
          <Button variant="secondary" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
