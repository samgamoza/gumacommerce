"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { SarabHero, SarabMarquee, SarabNavbar, SarabTopbar } from "./sarab-sections";
import { SarabFooter, SarabMenu } from "./sarab-menu-footer";
import "./sarab-theme.css";

export function SarabStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const secondary = tenant.shopTheme.accentColor;

  return (
    <div
      className="sarab-root min-h-screen"
      style={{
        ["--primary" as string]: primary,
        ["--secondary" as string]: secondary,
      }}
    >
      <SarabTopbar tenant={tenant} />
      <SarabNavbar tenant={tenant} />
      <SarabHero tenant={tenant} />
      <SarabMarquee />
      <SarabMenu tenant={tenant} />
      <SarabFooter tenant={tenant} />
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
