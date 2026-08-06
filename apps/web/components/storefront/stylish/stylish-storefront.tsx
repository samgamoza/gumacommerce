"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { StylishCollection } from "./stylish-collection";
import { StylishFooter } from "./stylish-footer";
import { StylishHeader } from "./stylish-header";
import { StylishHero } from "./stylish-hero";
import { StylishProductGrid } from "./stylish-product-grid";
import { StylishPromo } from "./stylish-promo";
import "./stylish-theme.css";

export function StylishStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="stylish-root min-h-screen"
      style={{
        ["--st-primary" as string]: primary,
        ["--st-accent" as string]: accent,
      }}
    >
      <StylishHeader tenant={tenant} />
      <main>
        <StylishHero tenant={tenant} />
        <StylishPromo tenant={tenant} />
        <StylishProductGrid tenant={tenant} />
        <StylishCollection tenant={tenant} />
      </main>
      <StylishFooter tenant={tenant} />
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
