"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { ZayCategories } from "./zay-categories";
import { ZayFooter } from "./zay-footer";
import { ZayHeader } from "./zay-header";
import { ZayHero } from "./zay-hero";
import { ZayProductGrid } from "./zay-product-grid";
import "./zay-theme.css";

export function ZayStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="zay-root min-h-screen"
      style={{
        ["--zay-primary" as string]: primary,
        ["--zay-primary-hover" as string]: primary,
        ["--zay-dark" as string]: accent,
      }}
    >
      <ZayHeader tenant={tenant} />
      <main>
        <ZayHero tenant={tenant} />
        <ZayCategories tenant={tenant} />
        <ZayProductGrid tenant={tenant} />
      </main>
      <ZayFooter tenant={tenant} />
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
