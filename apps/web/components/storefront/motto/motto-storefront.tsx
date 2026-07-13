"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import {
  MottoCategories,
  MottoFooter,
  MottoHeader,
  MottoHero,
  MottoProducts,
} from "./motto-sections";
import "./motto-theme.css";

export function MottoStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="mt-root min-h-screen"
      style={{
        ["--mt-primary" as string]: primary,
        ["--mt-accent" as string]: accent,
      }}
    >
      <MottoHeader tenant={tenant} />
      <main>
        <MottoHero tenant={tenant} />
        <MottoCategories tenant={tenant} />
        <MottoProducts tenant={tenant} />
      </main>
      <MottoFooter tenant={tenant} />
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
