"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, MapPin, Phone, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StorefrontStoreSettings } from "@/lib/storefront-settings";
import {
  computeDeliveryFee,
  deliveryProviderLabel,
} from "@/lib/storefront-settings";

const ALL_PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", icon: "💙", desc: "Pay via GCash app" },
  { id: "paymaya", label: "Maya", icon: "💚", desc: "Pay via Maya app" },
  { id: "qrph", label: "QR Ph", icon: "📱", desc: "Scan to pay" },
  { id: "cod", label: "Cash on Delivery", icon: "💵", desc: "Pay rider on arrival" },
];

function formatPrice(amount: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function CheckoutForm({
  tenantSlug,
  storeSettings,
}: {
  tenantSlug: string;
  storeSettings: StorefrontStoreSettings;
}) {
  const paymentMethods = useMemo(
    () =>
      ALL_PAYMENT_METHODS.filter(
        (method) => method.id !== "cod" || storeSettings.codEnabled
      ),
    [storeSettings.codEnabled]
  );

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState(paymentMethods[0]?.id ?? "gcash");
  const [loading, setLoading] = useState(false);

  const subtotal = 149;
  const deliveryFee =
    fulfillment === "pickup" ? 0 : computeDeliveryFee(subtotal, storeSettings);
  const total = subtotal + deliveryFee;
  const belowMinimum = subtotal < storeSettings.minOrderAmount;

  async function handleCheckout() {
    if (belowMinimum) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          paymentMethod: payment,
          fulfillment,
          amount: total,
          customer: { name: "Juan Dela Cruz", phone: "09171234567" },
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.orderNumber) {
        window.location.href = `/${tenantSlug}/orders/${data.orderNumber}`;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-8">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link
            href={`/${tenantSlug}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold">Checkout</h1>
            <p className="text-xs text-muted-foreground">Secure · Guest checkout</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {storeSettings.delivery.deliveryNotes && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {storeSettings.delivery.deliveryNotes}
          </div>
        )}

        {storeSettings.delivery.pickupEnabled && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">How would you like to receive your order?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFulfillment("delivery")}
                className={`rounded-xl border p-3 text-left transition ${
                  fulfillment === "delivery"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/60 bg-background hover:border-primary/20"
                }`}
              >
                <MapPin className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Delivery</p>
              </button>
              <button
                type="button"
                onClick={() => setFulfillment("pickup")}
                className={`rounded-xl border p-3 text-left transition ${
                  fulfillment === "pickup"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/60 bg-background hover:border-primary/20"
                }`}
              >
                <Store className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Store pickup</p>
                <p className="text-[10px] text-muted-foreground">No delivery fee</p>
              </button>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {fulfillment === "pickup" ? (
                <>
                  <Store className="h-4 w-4 text-primary" />
                  Pickup details
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-primary" />
                  Delivery details
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Full name"
                defaultValue="Juan Dela Cruz"
                className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Mobile (09XX XXX XXXX)"
                defaultValue="09171234567"
                className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            {fulfillment === "delivery" ? (
              <textarea
                placeholder="Complete address (Barangay, City, Province)"
                rows={3}
                defaultValue="Brgy. Poblacion, Makati City, Metro Manila"
                className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            ) : (
              <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                We&apos;ll text you when your order is ready for pickup.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment method</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPayment(m.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  payment === m.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/60 bg-background hover:border-primary/20"
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <p className="mt-1 text-sm font-semibold">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Premium Halo-Halo × 1</span>
              <span>{formatPrice(subtotal, storeSettings.currency)}</span>
            </div>
            {fulfillment === "delivery" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {deliveryProviderLabel(storeSettings.delivery.provider)}
                  {deliveryFee === 0 && storeSettings.delivery.freeDeliveryMin > 0
                    ? " (free)"
                    : ""}
                </span>
                <span>{formatPrice(deliveryFee, storeSettings.currency)}</span>
              </div>
            )}
            {storeSettings.minOrderAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Minimum order: {formatPrice(storeSettings.minOrderAmount, storeSettings.currency)}
              </p>
            )}
            <div className="flex justify-between border-t border-border/60 pt-3 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total, storeSettings.currency)}</span>
            </div>
          </CardContent>
        </Card>

        {belowMinimum && (
          <p className="text-center text-sm text-red-600">
            Minimum order is {formatPrice(storeSettings.minOrderAmount, storeSettings.currency)}.
            Add more items to checkout.
          </p>
        )}

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleCheckout}
          disabled={loading || belowMinimum}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : payment === "cod" ? (
            "Place Order (COD)"
          ) : (
            `Pay ${formatPrice(total, storeSettings.currency)}`
          )}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Secure checkout · SMS confirmation · DPA compliant
        </p>
      </div>
    </div>
  );
}
