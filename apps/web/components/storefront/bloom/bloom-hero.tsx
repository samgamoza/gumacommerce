import type { DemoTenant } from "@/lib/demo-data";

export function BloomHero({ tenant }: { tenant: DemoTenant }) {
  const headline =
    tenant.shopTheme.promoTitle?.replace(/✨/g, "").trim() || "Step Into Style";
  const subtitle =
    tenant.tagline ||
    tenant.shopTheme.tagline ||
    `Discover our latest collection from ${tenant.name}.`;

  return (
    <div className="mx-auto mb-12 max-w-3xl space-y-3 px-4 text-center sm:mb-16">
      <h1 className="text-4xl font-semibold tracking-tight text-balance lg:text-5xl">
        {headline}
      </h1>
      <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">{subtitle}</p>
    </div>
  );
}
