"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import {
  AirconAbout,
  AirconFooter,
  AirconHeader,
  AirconHero,
  AirconProducts,
  AirconQuote,
  AirconServices,
} from "./aircon-sections";
import { AIRCON_DEFAULT_ACCENT, AIRCON_DEFAULT_PRIMARY } from "./aircon-utils";
import "./aircon-theme.css";

export function AirconStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor || AIRCON_DEFAULT_PRIMARY;
  const accent = tenant.shopTheme.accentColor || AIRCON_DEFAULT_ACCENT;

  return (
    <div
      className="ac-root min-h-screen"
      style={{
        ["--ac-primary" as string]: primary,
        ["--ac-accent" as string]: accent,
      }}
    >
      <AirconHeader tenant={tenant} />
      <main>
        <AirconHero tenant={tenant} />
        <AirconAbout tenant={tenant} />
        <AirconServices />
        <AirconProducts tenant={tenant} />
        <AirconQuote tenant={tenant} />
      </main>
      <AirconFooter tenant={tenant} />
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
