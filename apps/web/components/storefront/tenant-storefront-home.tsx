import { resolveStorePattern, getStorePattern } from "@guma-commerce/storefront-themes";
import { StorefrontExperience } from "@/components/storefront/experience/storefront-experience";
import { SweetKitchenStorefront } from "@/components/storefront/sweet-kitchen/sweet-kitchen-storefront";
import { ThemedStorefrontHome } from "@/components/storefront/themed-home";
import type { DemoTenant } from "@/lib/demo-data";

export function TenantStorefrontHome({
  tenant,
  activeCategorySlug,
}: {
  tenant: DemoTenant;
  activeCategorySlug?: string;
  utmLabel?: string;
}) {
  const patternId = tenant.patternId ?? resolveStorePattern({ templateId: tenant.shopTheme.templateId });
  const pattern = getStorePattern(patternId);

  if (pattern.storefrontRenderer === "sweet-kitchen") {
    return <SweetKitchenStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "experience") {
    return <StorefrontExperience tenant={tenant} activeCategorySlug={activeCategorySlug} />;
  }

  return <ThemedStorefrontHome tenant={tenant} />;
}
