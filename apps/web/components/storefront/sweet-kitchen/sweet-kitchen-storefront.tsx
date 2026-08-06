"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { SweetFooter } from "./sweet-footer";
import { SweetHero } from "./sweet-hero";
import { SweetNavbar } from "./sweet-navbar";
import { SweetProductGrid } from "./sweet-product-grid";
import "./sweet-kitchen-theme.css";

export function SweetKitchenStorefront({ tenant }: { tenant: DemoTenant }) {
  const accent = tenant.shopTheme.primaryColor;

  return (
    <div
      className="sweet-kitchen-root min-h-screen"
      style={{ ["--sweet-neon" as string]: accent }}
    >
      <SweetNavbar
        tenantSlug={tenant.slug}
        shopName={tenant.name}
        logoUrl={tenant.logoUrl}
        accent={accent}
      />
      <main>
        <SweetHero tenant={tenant} />
        <SweetProductGrid tenant={tenant} />
      </main>
      <SweetFooter tenant={tenant} />
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
