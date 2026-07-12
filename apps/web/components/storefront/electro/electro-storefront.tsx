"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { ElectroFooter } from "./electro-footer";
import { ElectroHeader } from "./electro-header";
import { ElectroHero } from "./electro-hero";
import { ElectroProductGrid } from "./electro-product-grid";
import { ElectroServices } from "./electro-services";
import "./electro-theme.css";

export function ElectroStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const secondary = tenant.shopTheme.accentColor;

  return (
    <div
      className="electro-root min-h-screen"
      style={{
        ["--electro-primary" as string]: primary,
        ["--electro-secondary" as string]: secondary,
      }}
    >
      <ElectroHeader tenant={tenant} />
      <main>
        <ElectroHero tenant={tenant} />
        <ElectroServices />
        <ElectroProductGrid tenant={tenant} />
      </main>
      <ElectroFooter tenant={tenant} />
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
