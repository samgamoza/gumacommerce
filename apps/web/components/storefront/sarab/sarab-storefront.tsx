"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { StorefrontCartBar } from "@/components/storefront/storefront-cart-bar";
import { whatsappChatUrl } from "@/lib/storefront-settings";
import { storefrontUrl } from "@/lib/utils";
import { SarabHero, SarabMarquee, SarabNavbar, SarabTopbar } from "./sarab-sections";
import { SarabFooter, SarabMenu } from "./sarab-menu-footer";
import "./sarab-theme.css";

export function SarabStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const secondary = tenant.shopTheme.accentColor;
  const whatsapp = tenant.storeSettings.whatsapp;
  const wa =
    whatsapp.enabled && whatsapp.phone
      ? whatsappChatUrl(
          whatsapp.phone,
          `${whatsapp.greeting}\n\n${storefrontUrl}/${tenant.slug}`
        )
      : null;

  return (
    <div
      className="sarab-root min-h-screen"
      style={{
        ["--primary" as string]: primary,
        ["--secondary" as string]: secondary,
      }}
    >
      <SarabTopbar tenant={tenant} />
      <SarabNavbar tenant={tenant} />
      <SarabHero tenant={tenant} />
      <SarabMarquee />
      <SarabMenu tenant={tenant} />
      <SarabFooter tenant={tenant} />
      <StorefrontCartBar tenantSlug={tenant.slug} accent={primary} />
      <ShopAssistant
        tenantSlug={tenant.slug}
        shopName={tenant.name}
        assistant={tenant.storeSettings.shopAssistant}
        whatsappUrl={wa}
      />
    </div>
  );
}
