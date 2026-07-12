"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { BloomFooter } from "./bloom-footer";
import { BloomHeader } from "./bloom-header";
import { BloomHero } from "./bloom-hero";
import { BloomProductGrid } from "./bloom-product-grid";
import "./bloom-theme.css";

export function BloomStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;

  return (
    <div
      className="bloom-root flex min-h-screen flex-col"
      style={{
        ["--bloom-primary" as string]: primary,
        ["--bloom-primary-fg" as string]: "#ffffff",
      }}
    >
      <BloomHeader
        tenantSlug={tenant.slug}
        shopName={tenant.name}
        logoUrl={tenant.logoUrl}
        primary={primary}
      />
      <main className="flex-grow px-4 py-8 sm:py-12 lg:px-8">
        <BloomHero tenant={tenant} />
        <BloomProductGrid tenant={tenant} />
      </main>
      <BloomFooter tenant={tenant} />
      {tenant.storeSettings.shopAssistant.enabled && (
        <ShopAssistant
          tenantSlug={tenant.slug}
          shopName={tenant.name}
          assistant={tenant.storeSettings.shopAssistant}
        />
      )}
    </div>
  );
}
