import { LandingCta, LandingPricing } from "@/components/landing/pricing";
import { LandingFooter } from "@/components/landing/footer";
import {
  LandingFeatures,
  LandingHowItWorks,
  LandingSocialProof,
} from "@/components/landing/features";
import { LandingComparison } from "@/components/landing/comparison";
import { LandingHero, LandingMarquee } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/navbar";

const stats = [
  { value: "60s", label: "Avg. checkout time" },
  { value: "8%+", label: "Store conversion" },
  { value: "₱0", label: "To start" },
  { value: "24/7", label: "Orders while you sleep" },
];

/** frontend1 — the GumaCommerce marketing landing. */
export function Frontend1Landing() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingMarquee />
        <section className="bg-background py-12">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-8 gap-y-10 px-4 text-center sm:grid-cols-4 sm:divide-x sm:divide-border/60 sm:px-6">
            {stats.map((stat) => (
              <div key={stat.label} className="px-2">
                <p className="font-display text-3xl font-extrabold text-gradient sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
        <LandingComparison />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingSocialProof />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
