import { LandingCta, LandingPricing } from "@/components/landing/pricing";
import { LandingFooter } from "@/components/landing/footer";
import {
  LandingFeatures,
  LandingHowItWorks,
  LandingSocialProof,
} from "@/components/landing/features";
import { LandingHero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <LandingHero />
        <section className="border-b border-border/60 bg-background py-10">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 text-center sm:grid-cols-4 sm:px-6">
            {[
              { value: "60s", label: "Avg. checkout time" },
              { value: "8%+", label: "Store conversion" },
              { value: "₱0", label: "To start" },
              { value: "24/7", label: "Orders while you sleep" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-primary sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
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
