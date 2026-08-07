"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import {
  HaircutAbout,
  HaircutFooter,
  HaircutHeader,
  HaircutHero,
  HaircutPricing,
  HaircutServices,
} from "./haircut-sections";
import "./haircut-theme.css";

export function HaircutStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="hc-root min-h-screen"
      style={{
        ["--hc-primary" as string]: primary,
        ["--hc-secondary" as string]: accent || "#191c24",
      }}
    >
      <HaircutHeader tenant={tenant} />
      <main>
        <HaircutHero tenant={tenant} />
        <HaircutAbout tenant={tenant} />
        <HaircutServices tenant={tenant} />
        <HaircutPricing tenant={tenant} />
      </main>
      <HaircutFooter tenant={tenant} />
      {(tenant.storeSettings.shopAssistant.enabled || tenant.storeSettings.shopAssistant.humanInbox !== false) && (
        <ShopAssistant
          tenantSlug={tenant.slug}
          shopName={tenant.name}
          assistant={tenant.storeSettings.shopAssistant}
        />
      )}
    </div>
  );
}
