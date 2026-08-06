"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { MinistoreFooter } from "./ministore-footer";
import { MinistoreHeader } from "./ministore-header";
import { MinistoreHero } from "./ministore-hero";
import { MinistoreMobileProducts, MinistoreWatches } from "./ministore-product-rows";
import { MinistoreSaleBanner } from "./ministore-sale-banner";
import { MinistoreServices } from "./ministore-services";
import "./ministore-theme.css";

export function MinistoreStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="ministore-root min-h-screen"
      style={{
        ["--ms-primary" as string]: primary,
        ["--ms-accent" as string]: accent,
      }}
    >
      <MinistoreHeader tenant={tenant} />
      <main>
        <MinistoreHero tenant={tenant} />
        <MinistoreServices />
        <MinistoreMobileProducts tenant={tenant} />
        <MinistoreWatches tenant={tenant} />
        <MinistoreSaleBanner tenant={tenant} />
      </main>
      <MinistoreFooter tenant={tenant} />
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
