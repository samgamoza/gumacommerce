import { getStorefrontTenant } from "@/lib/get-storefront-tenant";
import { StorefrontTracking } from "@/components/storefront/storefront-tracking";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantStorefrontLayout({ children, params }: LayoutProps) {
  const { tenantSlug } = await params;
  const tenant = await getStorefrontTenant(tenantSlug);

  return (
    <>
      {tenant && <StorefrontTracking tracking={tenant.storeSettings.tracking} />}
      {children}
    </>
  );
}
