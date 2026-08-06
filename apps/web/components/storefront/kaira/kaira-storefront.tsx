"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { KairaCategoryBanners } from "./kaira-category-banners";
import { KairaCollection } from "./kaira-collection";
import { KairaFeatures } from "./kaira-features";
import { KairaFooter } from "./kaira-footer";
import { KairaHeader } from "./kaira-header";
import { KairaHero } from "./kaira-hero";
import { KairaNewsletter } from "./kaira-newsletter";
import { KairaProductRow } from "./kaira-product-row";
import "./kaira-theme.css";

export function KairaStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="kaira-root min-h-screen"
      style={{
        ["--kaira-primary" as string]: primary,
        ["--kaira-accent" as string]: accent,
      }}
    >
      <KairaHeader tenant={tenant} />
      <main>
        <KairaHero tenant={tenant} />
        <KairaFeatures />
        <KairaCategoryBanners tenant={tenant} />
        <KairaProductRow
          tenant={tenant}
          title="Our New Arrivals"
          filter={(products) => products.filter((p) => p.tags.includes("new"))}
        />
        <KairaCollection tenant={tenant} />
        <KairaProductRow
          tenant={tenant}
          title="Best Selling Items"
          filter={(products) => products.filter((p) => p.tags.includes("bestseller"))}
        />
      </main>
      <KairaNewsletter />
      <KairaFooter tenant={tenant} />
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
