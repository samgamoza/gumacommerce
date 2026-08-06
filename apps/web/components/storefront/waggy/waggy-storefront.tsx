"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { WaggyCategories } from "./waggy-categories";
import { WaggyFooter } from "./waggy-footer";
import { WaggyHeader } from "./waggy-header";
import { WaggyHero } from "./waggy-hero";
import { WaggyProductGrid } from "./waggy-product-grid";
import { WaggyServices } from "./waggy-services";
import "./waggy-theme.css";

export function WaggyStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="waggy-root min-h-screen"
      style={{
        ["--wg-primary" as string]: primary,
        ["--wg-accent" as string]: accent,
      }}
    >
      <WaggyHeader tenant={tenant} />
      <main>
        <WaggyHero tenant={tenant} />
        <WaggyCategories tenant={tenant} />
        <WaggyProductGrid tenant={tenant} />
        <WaggyServices />
      </main>
      <WaggyFooter tenant={tenant} />
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
