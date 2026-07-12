"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { FruitablesBanner } from "./fruitables-banner";
import { FruitablesFeatures } from "./fruitables-features";
import { FruitablesFooter } from "./fruitables-footer";
import { FruitablesHeader } from "./fruitables-header";
import { FruitablesHero } from "./fruitables-hero";
import { FruitablesProductGrid, FruitablesVegetableScroll } from "./fruitables-product-grid";
import { FruitablesPromos } from "./fruitables-promos";
import "./fruitables-theme.css";

export function FruitablesStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const secondary = tenant.shopTheme.accentColor;

  return (
    <div
      className="fruitables-root min-h-screen"
      style={{
        ["--fb-primary" as string]: primary,
        ["--fb-secondary" as string]: secondary,
      }}
    >
      <FruitablesHeader tenant={tenant} />
      <main>
        <FruitablesHero tenant={tenant} />
        <FruitablesFeatures />
        <FruitablesProductGrid tenant={tenant} />
        <FruitablesPromos tenant={tenant} />
        <FruitablesVegetableScroll tenant={tenant} />
        <FruitablesBanner tenant={tenant} />
      </main>
      <FruitablesFooter tenant={tenant} />
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
