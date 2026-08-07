"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import {
  SpecialtyAbout,
  SpecialtyFooter,
  SpecialtyHeader,
  SpecialtyHero,
  SpecialtySecondary,
} from "./specialty-sections";
import "./specialty-theme.css";

export function SpecialtyStorefront({ tenant }: { tenant: DemoTenant }) {
  const primary = tenant.shopTheme.primaryColor;
  const accent = tenant.shopTheme.accentColor;
  const radius = tenant.shopTheme.radius || "1rem";
  const font = tenant.shopTheme.displayFont;
  const headingFont =
    font === "mono-accent"
      ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
      : font === "system"
        ? "var(--font-jakarta), system-ui, sans-serif"
        : '"Fraunces", Georgia, serif';
  const bodyFont =
    font === "mono-accent"
      ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
      : '"DM Sans", system-ui, sans-serif';

  return (
    <div
      className="sp-root min-h-screen"
      style={{
        ["--sp-primary" as string]: primary,
        ["--sp-accent" as string]: accent,
        ["--sp-radius" as string]: radius,
        ["--sp-heading" as string]: headingFont,
        ["--sp-body" as string]: bodyFont,
        ["--sp-bg" as string]: `color-mix(in srgb, ${primary} 8%, #f8fafc)`,
        ["--sp-ink" as string]: `color-mix(in srgb, ${primary} 35%, #0f172a)`,
      }}
    >
      <SpecialtyHeader tenant={tenant} />
      <main>
        <SpecialtyHero tenant={tenant} />
        <SpecialtySecondary tenant={tenant} />
        <SpecialtyAbout tenant={tenant} />
      </main>
      <SpecialtyFooter tenant={tenant} />
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
