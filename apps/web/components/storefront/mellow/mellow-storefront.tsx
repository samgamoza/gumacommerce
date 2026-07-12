"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { MellowAbout } from "./mellow-about";
import { MellowFooter } from "./mellow-footer";
import { MellowGallery } from "./mellow-gallery";
import { MellowHeader } from "./mellow-header";
import { MellowHero } from "./mellow-hero";
import { MellowRooms } from "./mellow-rooms";
import { MellowServices } from "./mellow-services";
import { MellowStats } from "./mellow-stats";
import "./mellow-theme.css";

export function MellowStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="mellow-root min-h-screen"
      style={{
        ["--ml-primary" as string]: primary,
        ["--ml-accent" as string]: accent,
      }}
    >
      <MellowHeader tenant={tenant} />
      <main>
        <MellowHero tenant={tenant} />
        <MellowAbout tenant={tenant} />
        <MellowStats />
        <MellowRooms tenant={tenant} />
        <MellowGallery />
        <MellowServices />
      </main>
      <MellowFooter tenant={tenant} />
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
