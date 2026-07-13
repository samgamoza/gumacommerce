"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import {
  CarservBooking,
  CarservFooter,
  CarservHeader,
  CarservHero,
  CarservProducts,
  CarservServices,
} from "./carserv-sections";
import "./carserv-theme.css";

export function CarservStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;

  return (
    <div
      className="cs-root min-h-screen"
      style={{
        ["--cs-primary" as string]: primary,
        ["--cs-accent" as string]: accent,
      }}
    >
      <CarservHeader tenant={tenant} />
      <main>
        <CarservHero tenant={tenant} />
        <CarservServices />
        <CarservProducts tenant={tenant} />
        <CarservBooking tenant={tenant} />
      </main>
      <CarservFooter tenant={tenant} />
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
