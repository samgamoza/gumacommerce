import type { Metadata } from "next";
import {
  Breadcrumb,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { LandingPricing, LandingCta } from "@/components/landing/pricing";

export const metadata: Metadata = {
  title: "Pricing — Guma Commerce",
  description: "Simple, transparent pricing for Philippine social sellers. Start free, scale when ready.",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Pricing" }]} />
      <PageHeader
        eyebrow="Pricing"
        title="Simple plans that grow with you"
        description="No hidden fees. No lock-in. Start free and upgrade when your orders take off."
      />
      <LandingPricing />
      <div className="mx-auto max-w-3xl px-4 pb-8 text-center text-sm text-muted-foreground">
        <p>
          All paid plans include a 2.5% + ₱5 platform fee per successful paid order (excluding COD).
          Payment gateway fees from PayMongo/Xendit are passed through at cost.
        </p>
      </div>
      <LandingCta />
    </MarketingShell>
  );
}
