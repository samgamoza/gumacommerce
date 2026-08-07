"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { solidCtaColor } from "@/lib/color-contrast";
import { ElectroFooter } from "./electro-footer";
import { ElectroHeader } from "./electro-header";
import { ElectroHero } from "./electro-hero";
import { ElectroProductGrid } from "./electro-product-grid";
import { ElectroServices } from "./electro-services";
import "./electro-theme.css";

export function ElectroStorefront({ tenant }: { tenant: DemoTenant }) {
  // Pale theme picks (e.g. #eff2f5) make orange/white CTAs vanish — keep electro buttons readable.
  const primary = solidCtaColor(tenant.shopTheme.primaryColor, "#f28b00");
  const secondary = solidCtaColor(tenant.shopTheme.accentColor, "#212529");

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
