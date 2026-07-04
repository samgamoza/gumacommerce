import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getStorefrontTenant } from "@/lib/get-storefront-tenant";

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getStorefrontTenant(tenantSlug);
  if (!tenant) notFound();

  return <CheckoutForm tenantSlug={tenantSlug} storeSettings={tenant.storeSettings} />;
}
