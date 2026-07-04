"use client";



import { useState } from "react";

import { Badge, Button, Card } from "@guma-commerce/ui";

import { SettingsShell } from "@/components/settings/settings-shell";

import { useTenantSettings } from "@/components/settings/settings-forms";



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

    features: ["Standard templates", "Background removal", "Priority support"],

  },

  {

    id: "pro",

    name: "Pro",

    price: "₱999/mo",

    features: ["Advanced templates", "SMS notifications", "WhatsApp agent"],

  },

] as const;



export function SubscriptionSettingsPage() {

  const { settings, loading, saving, error, saved, save } = useTenantSettings();

  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const currentPlan = settings?.subscriptionPlan ?? "free";



  async function selectPlan(planId: string) {

    setPendingPlan(planId);

    await save({ subscriptionPlan: planId });

    setPendingPlan(null);

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

      {saved && <p className="mb-4 text-sm text-emerald-700">Plan updated.</p>}



      <Card className="mb-4 border-emerald-100 bg-emerald-50/50 p-5">

        <p className="text-sm text-gray-600">Current plan</p>

        <p className="mt-1 text-2xl font-bold capitalize text-emerald-800">
          {PLANS.find((p) => p.id === currentPlan)?.name ?? currentPlan}
        </p>

        <p className="mt-2 text-sm text-gray-600">

          Shop status: <span className="font-medium capitalize">{settings?.status}</span>

        </p>

      </Card>



      <div className="grid gap-4 md:grid-cols-3">

        {PLANS.map((plan) => {

          const active = plan.id === currentPlan;

          const switching = pendingPlan === plan.id && saving;

          return (

            <Card key={plan.id} className={`p-5 ${active ? "ring-2 ring-emerald-500" : ""}`}>

              <div className="flex items-center justify-between gap-2">

                <h3 className="font-semibold">{plan.name}</h3>

                {active && <Badge className="bg-emerald-100 text-emerald-800">Current</Badge>}

              </div>

              <p className="mt-2 text-2xl font-bold">{plan.price}</p>

              <ul className="mt-4 space-y-2 text-sm text-gray-600">

                {plan.features.map((feature) => (

                  <li key={feature}>• {feature}</li>

                ))}

              </ul>

              {!active && (

                <Button

                  className="mt-4 w-full"

                  variant="secondary"

                  disabled={saving}

                  onClick={() => selectPlan(plan.id)}

                >

                  {switching ? "Switching…" : `Switch to ${plan.name}`}

                </Button>

              )}

            </Card>

          );

        })}

      </div>



      <p className="mt-6 text-sm text-gray-500">

        Plan changes apply immediately for testing. Paid billing will be enabled soon — email

        support@gumacommerce.ph for early access.

      </p>

    </SettingsShell>

  );

}

