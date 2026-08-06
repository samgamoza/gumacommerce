"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { OrganicCategories } from "./organic-categories";
import { OrganicFooter } from "./organic-footer";
import { OrganicHeader } from "./organic-header";
import { OrganicHero } from "./organic-hero";
import { OrganicProductGrid } from "./organic-product-grid";
import "./organic-theme.css";

export function OrganicStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="organic-root min-h-screen"
      style={{
        ["--og-primary" as string]: primary,
        ["--og-accent" as string]: accent,
      }}
    >
      <OrganicHeader tenant={tenant} />
      <main>
        <OrganicHero tenant={tenant} />
        <OrganicCategories tenant={tenant} />
        <OrganicProductGrid tenant={tenant} />
      </main>
      <OrganicFooter tenant={tenant} />
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
