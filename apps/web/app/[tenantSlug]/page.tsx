import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPendingStorefrontTenant,
  getStorefrontTenant,
} from "@/lib/get-storefront-tenant";
import { adminUrl } from "@/lib/utils";
import { ShopShell } from "@/components/storefront/shop-shell";
import { ShopifyCatalog } from "@/components/storefront/shopify-catalog";

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function StorefrontPage({ params, searchParams }: PageProps) {
  const { tenantSlug } = await params;
  const query = await searchParams;
  const tenant = await getStorefrontTenant(tenantSlug);

  if (!tenant) {
    const pending = await getPendingStorefrontTenant(tenantSlug);
    if (pending) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6 text-center">
          <p className="text-5xl">🛍️</p>
          <h1 className="mt-4 text-2xl font-bold">{pending.name}</h1>
          <p className="mt-2 max-w-sm text-neutral-600">
            This shop is being set up and isn&apos;t live yet.
          </p>
          <Link
            href={`${adminUrl}/shop-builder`}
            className="mt-6 inline-flex rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Design your shop
          </Link>
        </div>
      );
    }

    notFound();
  }

  return (
    <ShopShell tenant={tenant}>
      <ShopifyCatalog tenant={tenant} activeCategorySlug={query.category} />
    </ShopShell>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { tenantSlug } = await params;
  const tenant = await getStorefrontTenant(tenantSlug);
  if (tenant) {
    return {
      title: `${tenant.name} — Shop`,
      description: tenant.tagline,
    };
  }

  const pending = await getPendingStorefrontTenant(tenantSlug);
  if (pending) {
    return {
      title: `${pending.name} — Coming soon`,
      description: `${pending.name} is setting up their Guma Commerce shop.`,
    };
  }

  return {};
}
