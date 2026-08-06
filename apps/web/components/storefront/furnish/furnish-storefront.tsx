"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { FurnishNewsletter, FurnishTestimonial } from "./furnish-extras";
import { FurnishFooter } from "./furnish-footer";
import { FurnishHeader } from "./furnish-header";
import { FurnishHero } from "./furnish-hero";
import { FurnishProductGrid } from "./furnish-product-grid";
import "./furnish-theme.css";

export function FurnishStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const secondary = tenant.shopTheme.accentColor;

  return (
    <div
      className="furnish-root min-h-screen"
      style={{
        ["--furnish-primary" as string]: primary,
        ["--furnish-secondary" as string]: secondary,
      }}
    >
      <FurnishHeader tenant={tenant} />
      <main>
        <FurnishHero tenant={tenant} />
        <FurnishProductGrid tenant={tenant} />
        <FurnishTestimonial />
        <FurnishNewsletter tenant={tenant} />
      </main>
      <FurnishFooter tenant={tenant} />
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
