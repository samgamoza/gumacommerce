import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminUrl } from "@/lib/utils";

const plans = [
  {
    name: "Sulit",
    price: "₱0",
    period: "/month",
    desc: "Perfect for starting out",
    features: ["30 orders/month", "5 AI generations", "Guma Commerce subdomain", "GCash & COD"],
    cta: "Start free",
    href: `${adminUrl}/signup`,
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₱499",
    period: "/month",
    desc: "For growing social sellers",
    features: [
      "Unlimited orders",
      "100 AI generations",
      "Daily agents & SMS reminders",
      "Priority support",
      "All payment methods",
    ],
    cta: "Get Growth",
    href: `${adminUrl}/signup`,
    highlighted: true,
  },
  {
    name: "Pro",
    price: "₱999",
    period: "/month",
    desc: "For serious brands",
    features: [
      "Everything in Growth",
      "500 AI generations",
      "Advanced campaign agents",
      "WhatsApp agent",
      "Lower transaction fees",
    ],
    cta: "Contact us",
    href: "/contact",
    highlighted: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="mt-4 text-muted-foreground">
            No setup fees. Pay only when you grow — plus a small fee per paid order.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border/60 ${
                plan.highlighted
                  ? "border-primary/40 shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.desc}</CardDescription>
                <div className="pt-2">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="mt-6 block">
                  <Button
                    variant={plan.highlighted ? "default" : "secondary"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-6 py-16 text-center shadow-2xl shadow-emerald-900/20 sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Ready to stop losing sales in Messenger?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-emerald-50/90">
              Join Philippine sellers who turned their social following into a real business — with
              a storefront that converts.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/demo">
                <Button size="xl" variant="white">
                  Launch demo shop
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`${adminUrl}/signup`}>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  Start free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
