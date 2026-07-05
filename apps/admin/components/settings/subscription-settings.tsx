"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card } from "@guma-commerce/ui";
import { SettingsShell } from "@/components/settings/settings-shell";
import { useTenantSettings } from "@/components/settings/settings-forms";
import { modelStoreUrl } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Sulit",
    price: "₱0",
    features: ["Basic shop templates", "AI product listings", "COD checkout"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "₱499/mo",
    features: [
      "Standard templates (Neon Bazaar, Street Cart…)",
      "Flash deals & review sections",
      "Background removal",
      "Priority support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₱999/mo",
    features: [
      "Advanced templates (Glass Future, Holo Grid…)",
      "Live selling layout + WhatsApp agent",
      "SMS order notifications",
      "Lower AI costs at scale",
    ],
  },
] as const;
const PAY_METHODS = [
  { id: "gcash", label: "GCash" },
  { id: "paymaya", label: "Maya" },
  { id: "card", label: "Card" },
] as const;

const SUPPORT_EMAIL = "support@gumacommerce.ph";

export function SubscriptionSettingsPage() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const refSource = searchParams.get("ref") ?? searchParams.get("from");
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const { settings, loading, error } = useTenantSettings();
  const currentPlan = settings?.subscriptionPlan ?? "free";
  const [method, setMethod] = useState<(typeof PAY_METHODS)[number]["id"]>("gcash");
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (highlight !== "growth" && highlight !== "pro") return;
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight, loading]);
  async function upgrade(plan: "growth" | "pro") {
    setPayingPlan(plan);
    setPayError(null);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, method }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPayError(data.error ?? "Could not start the payment.");
        return;
      }
      if (data.redirectUrl) {
        // PayMongo hosted payment page; the webhook applies the plan on success.
        window.location.href = data.redirectUrl;
        return;
      }
      setPayError("Payment started, but no payment page was returned. Contact support.");
    } catch {
      setPayError("Network error. Check your connection and try again.");
    } finally {
      setPayingPlan(null);
    }
  }

  if (loading) {
    return <SettingsShell title="Subscription" description="Loading…">…</SettingsShell>;
  }

  return (
    <SettingsShell
      title="Subscription"
      description="Your current Guma Commerce plan and available upgrades."
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {payError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {payError}
        </p>
      )}

      <Card className="mb-4 border-emerald-100 bg-emerald-50/50 p-5">
        <p className="text-sm text-gray-600">Current plan</p>
        <p className="mt-1 text-2xl font-bold capitalize text-emerald-800">
          {PLANS.find((p) => p.id === currentPlan)?.name ?? currentPlan}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Shop status: <span className="font-medium capitalize">{settings?.status}</span>
        </p>
      </Card>

      {currentPlan === "free" && (
        <Card className="mb-4 border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5">
          <p className="font-semibold text-amber-900">Not sure which plan fits?</p>
          <p className="mt-1 text-sm text-gray-600">
            Tour our flagship model store — live selling, flash deals, and reviews are labeled by
            plan tier so you know exactly what you&apos;re unlocking.
          </p>
          <a
            href={modelStoreUrl(refSource ? `subscription-${refSource}` : "subscription")}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
          >
            Open model store ↗
          </a>
        </Card>
      )}

      {refSource && (
        <p className="mb-4 text-xs text-gray-500">
          You arrived from the model store ({refSource.replace(/-/g, " ")}). Pick a plan below to
          unlock those features on your shop.
        </p>
      )}

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Pay with:</span>
        {PAY_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              method === m.id
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div ref={highlightRef} className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const active = plan.id === currentPlan;
          const highlighted = highlight === plan.id;
          return (
            <Card
              key={plan.id}
              className={`p-5 transition ${
                active
                  ? "ring-2 ring-emerald-500"
                  : highlighted
                    ? "ring-2 ring-amber-400 shadow-lg shadow-amber-100"
                    : ""
              }`}
            >              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{plan.name}</h3>
                {active && <Badge className="bg-emerald-100 text-emerald-800">Current</Badge>}
                {!active && highlighted && (
                  <Badge className="bg-amber-100 text-amber-800">Recommended</Badge>
                )}
              </div>              <p className="mt-2 text-2xl font-bold">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              {!active && plan.id !== "free" && (
                <Button
                  className="mt-4 w-full"
                  type="button"
                  disabled={payingPlan !== null}
                  onClick={() => upgrade(plan.id)}
                >
                  {payingPlan === plan.id ? "Opening payment…" : `Upgrade — ${plan.price}`}
                </Button>
              )}
              {!active && plan.id === "free" && (
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Downgrade to Sulit")}`}
                  className="mt-4 block"
                >
                  <Button className="w-full" variant="secondary" type="button">
                    Contact us to downgrade
                  </Button>
                </a>
              )}
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Plans renew every 30 days via PayMongo (GCash, Maya, or card). Your upgrade activates
        automatically the moment your payment is confirmed. Questions? Email {SUPPORT_EMAIL}.
      </p>
    </SettingsShell>
  );
}
