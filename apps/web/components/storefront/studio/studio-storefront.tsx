"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { StudioAbout, StudioFooter, StudioHeader, StudioHero, StudioPackages } from "./studio-sections";
import "./studio-theme.css";

export function StudioStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="st-root min-h-screen"
      style={{
        ["--st-primary" as string]: primary,
        ["--st-accent" as string]: accent,
      }}
    >
      <StudioHeader tenant={tenant} />
      <main>
        <StudioHero tenant={tenant} />
        <StudioAbout tenant={tenant} />
        <StudioPackages tenant={tenant} />
      </main>
      <StudioFooter tenant={tenant} />
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
