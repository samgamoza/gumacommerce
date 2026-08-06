"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { FoodmartCategories } from "./foodmart-categories";
import { FoodmartFooter } from "./foodmart-footer";
import { FoodmartHeader } from "./foodmart-header";
import { FoodmartHero } from "./foodmart-hero";
import { FoodmartProductGrid } from "./foodmart-product-grid";
import "./foodmart-theme.css";

export function FoodmartStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="foodmart-root min-h-screen"
      style={{
        ["--fm-primary" as string]: primary,
        ["--fm-accent" as string]: accent,
      }}
    >
      <FoodmartHeader tenant={tenant} />
      <main>
        <FoodmartHero tenant={tenant} />
        <FoodmartCategories tenant={tenant} />
        <FoodmartProductGrid tenant={tenant} />
      </main>
      <FoodmartFooter tenant={tenant} />
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
