import dynamic from "next/dynamic";
import { resolveStorePattern, getStorePattern } from "@guma-commerce/storefront-themes";
import { ThemedStorefrontHome } from "@/components/storefront/themed-home";
import type { DemoTenant } from "@/lib/demo-data";

const SweetKitchenStorefront = dynamic(() =>
  import("@/components/storefront/sweet-kitchen/sweet-kitchen-storefront").then((m) => ({
    default: m.SweetKitchenStorefront,
  }))
);
const BloomStorefront = dynamic(() =>
  import("@/components/storefront/bloom/bloom-storefront").then((m) => ({ default: m.BloomStorefront }))
);
const SarabStorefront = dynamic(() =>
  import("@/components/storefront/sarab/sarab-storefront").then((m) => ({ default: m.SarabStorefront }))
);
const FurnishStorefront = dynamic(() =>
  import("@/components/storefront/furnish/furnish-storefront").then((m) => ({ default: m.FurnishStorefront }))
);
const ZayStorefront = dynamic(() =>
  import("@/components/storefront/zay/zay-storefront").then((m) => ({ default: m.ZayStorefront }))
);
const ElectroStorefront = dynamic(() =>
  import("@/components/storefront/electro/electro-storefront").then((m) => ({ default: m.ElectroStorefront }))
);
const KairaStorefront = dynamic(() =>
  import("@/components/storefront/kaira/kaira-storefront").then((m) => ({ default: m.KairaStorefront }))
);
const FoodmartStorefront = dynamic(() =>
  import("@/components/storefront/foodmart/foodmart-storefront").then((m) => ({ default: m.FoodmartStorefront }))
);
const StylishStorefront = dynamic(() =>
  import("@/components/storefront/stylish/stylish-storefront").then((m) => ({ default: m.StylishStorefront }))
);
const MellowStorefront = dynamic(() =>
  import("@/components/storefront/mellow/mellow-storefront").then((m) => ({ default: m.MellowStorefront }))
);
const OrganicStorefront = dynamic(() =>
  import("@/components/storefront/organic/organic-storefront").then((m) => ({ default: m.OrganicStorefront }))
);
const WaggyStorefront = dynamic(() =>
  import("@/components/storefront/waggy/waggy-storefront").then((m) => ({ default: m.WaggyStorefront }))
);
const FruitablesStorefront = dynamic(() =>
  import("@/components/storefront/fruitables/fruitables-storefront").then((m) => ({
    default: m.FruitablesStorefront,
  }))
);
const MinistoreStorefront = dynamic(() =>
  import("@/components/storefront/ministore/ministore-storefront").then((m) => ({ default: m.MinistoreStorefront }))
);
const AirconStorefront = dynamic(() =>
  import("@/components/storefront/aircon/aircon-storefront").then((m) => ({ default: m.AirconStorefront }))
);
const CarservStorefront = dynamic(() =>
  import("@/components/storefront/carserv/carserv-storefront").then((m) => ({ default: m.CarservStorefront }))
);
const MottoStorefront = dynamic(() =>
  import("@/components/storefront/motto/motto-storefront").then((m) => ({ default: m.MottoStorefront }))
);
const StudioStorefront = dynamic(() =>
  import("@/components/storefront/studio/studio-storefront").then((m) => ({ default: m.StudioStorefront }))
);
const StorefrontExperience = dynamic(() =>
  import("@/components/storefront/experience/storefront-experience").then((m) => ({
    default: m.StorefrontExperience,
  }))
);

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

  if (pattern.storefrontRenderer === "bloom") {
    return <BloomStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "sarab") {
    return <SarabStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "furnish") {
    return <FurnishStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "zay") {
    return <ZayStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "electro") {
    return <ElectroStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "kaira") {
    return <KairaStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "foodmart") {
    return <FoodmartStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "stylish") {
    return <StylishStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "mellow") {
    return <MellowStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "organic") {
    return <OrganicStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "waggy") {
    return <WaggyStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "fruitables") {
    return <FruitablesStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "ministore") {
    return <MinistoreStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "aircon") {
    return <AirconStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "carserv") {
    return <CarservStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "motto") {
    return <MottoStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "studio") {
    return <StudioStorefront tenant={tenant} />;
  }

  if (pattern.storefrontRenderer === "experience") {
    return <StorefrontExperience tenant={tenant} activeCategorySlug={activeCategorySlug} />;
  }

  return <ThemedStorefrontHome tenant={tenant} />;
}
