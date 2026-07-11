import { TenantStorefrontHome } from "@/components/storefront/tenant-storefront-home";
import { getModelStoreTenant } from "@/lib/model-store-tenant";

export default function ModelStorePage() {
  const tenant = getModelStoreTenant();

  return <TenantStorefrontHome tenant={tenant} />;
}
