"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/lib/cart";
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

const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;

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
  const cart = useCart(tenantSlug);

  const paymentMethods = useMemo(
    () =>
      ALL_PAYMENT_METHODS.filter(
        (method) => method.id !== "cod" || storeSettings.codEnabled
      ),
    [storeSettings.codEnabled]
  );

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState(paymentMethods[0]?.id ?? "gcash");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [liveQuote, setLiveQuote] = useState<{ fee: number; etaMinutes: number | null } | null>(
    null
  );
  const [quoting, setQuoting] = useState(false);

  // Live Lalamove quote once the customer has typed a usable address.
  const wantsLiveQuote =
    storeSettings.delivery.provider === "lalamove" &&
    fulfillment === "delivery" &&
    address.trim().length >= 10;
  const quoteAddress = wantsLiveQuote ? address.trim() : "";

  useEffect(() => {
    if (!quoteAddress) {
      setLiveQuote(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/delivery/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantSlug, address: quoteAddress }),
        });
        const data = await res.json();
        if (!cancelled) {
          setLiveQuote(
            res.ok && data.live ? { fee: data.fee, etaMinutes: data.etaMinutes } : null
          );
        }
      } catch {
        if (!cancelled) setLiveQuote(null);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [quoteAddress, tenantSlug]);

  const subtotal = cart.subtotal;
  const deliveryFee =
    fulfillment === "pickup"
      ? 0
      : liveQuote?.fee ?? computeDeliveryFee(subtotal, storeSettings);
  const total = subtotal + deliveryFee;
  const belowMinimum = subtotal > 0 && subtotal < storeSettings.minOrderAmount;

  const cleanPhone = phone.replace(/[\s-]/g, "");
  const fieldErrors = {
    name: name.trim().length < 2 ? "Enter your full name." : null,
    phone: !PH_MOBILE.test(cleanPhone)
      ? "Enter a valid PH mobile number (09XX XXX XXXX)."
      : null,
    address:
      fulfillment === "delivery" && address.trim().length < 10
        ? "Enter your complete address (street, barangay, city)."
        : null,
  };
  const hasFieldErrors = Boolean(fieldErrors.name || fieldErrors.phone || fieldErrors.address);

  async function handleCheckout() {
    setTouched(true);
    setError(null);
    if (belowMinimum || cart.items.length === 0 || hasFieldErrors) return;

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          paymentMethod: payment,
          fulfillment,
          customer: { name: name.trim(), phone: cleanPhone },
          address: fulfillment === "delivery" ? address.trim() : undefined,
          notes: notes.trim() || undefined,
          items: cart.items.map((item) => ({ productId: item.productId, qty: item.qty })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Checkout failed. Please try again.");
        return;
      }

      cart.clear();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.orderNumber) {
        window.location.href = `/${tenantSlug}/orders/${data.orderNumber}`;
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (cart.ready && cart.items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <ShoppingBag className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold">Your cart is empty</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Browse the shop and tap “Add to Cart” on the products you want.
        </p>
        <Link href={`/${tenantSlug}`} className="mt-6">
          <Button size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Button>
        </Link>
      </div>
    );
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

        {/* Cart items */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Your order{cart.count > 0 ? ` (${cart.count} item${cart.count > 1 ? "s" : ""})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-primary">
                    {formatPrice(item.price, storeSettings.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.title} quantity`}
                    onClick={() => cart.setQty(item.productId, item.qty - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 hover:bg-muted"
                  >
                    {item.qty === 1 ? (
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.title} quantity`}
                    onClick={() => cart.setQty(item.productId, item.qty + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

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
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              {touched && fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Mobile (09XX XXX XXXX)"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              {touched && fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                We&apos;ll text your order confirmation and tracking link here.
              </p>
            </div>
            {fulfillment === "delivery" ? (
              <div>
                <textarea
                  placeholder="Complete address (Street, Barangay, City, Province)"
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  autoComplete="street-address"
                  className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
                {touched && fieldErrors.address && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                We&apos;ll text you when your order is ready for pickup.
              </p>
            )}
            <input
              placeholder="Delivery notes / landmark (optional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
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
              <span className="text-muted-foreground">
                Subtotal ({cart.count} item{cart.count > 1 ? "s" : ""})
              </span>
              <span>{formatPrice(subtotal, storeSettings.currency)}</span>
            </div>
            {fulfillment === "delivery" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {deliveryProviderLabel(storeSettings.delivery.provider)}
                  {liveQuote
                    ? liveQuote.etaMinutes
                      ? ` · live quote · ~${liveQuote.etaMinutes} min`
                      : " · live quote"
                    : quoting
                      ? " · getting quote…"
                      : deliveryFee === 0 && storeSettings.delivery.freeDeliveryMin > 0
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
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleCheckout}
          disabled={loading || belowMinimum || !cart.ready || cart.items.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : payment === "cod" ? (
            `Place Order (COD) · ${formatPrice(total, storeSettings.currency)}`
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
