"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import {
  SpecialtyAbout,
  SpecialtyFooter,
  SpecialtyHeader,
  SpecialtyHero,
  SpecialtySecondary,
} from "./specialty-sections";
import "./specialty-theme.css";

export function SpecialtyStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="sp-root min-h-screen"
      style={{
        ["--sp-primary" as string]: primary,
        ["--sp-accent" as string]: accent,
      }}
    >
      <SpecialtyHeader tenant={tenant} />
      <main>
        <SpecialtyHero tenant={tenant} />
        <SpecialtySecondary tenant={tenant} />
        <SpecialtyAbout tenant={tenant} />
      </main>
      <SpecialtyFooter tenant={tenant} />
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
