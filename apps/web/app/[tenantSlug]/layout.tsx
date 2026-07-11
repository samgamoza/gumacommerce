import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { getStorefrontTenant } from "@/lib/get-storefront-tenant";
import { StorefrontTracking } from "@/components/storefront/storefront-tracking";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantStorefrontLayout({ children, params }: LayoutProps) {
  const { tenantSlug } = await params;
  const tenant = await getStorefrontTenant(tenantSlug);

  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable}`}>
      {tenant && <StorefrontTracking tracking={tenant.storeSettings.tracking} />}
      {children}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getStorefrontTenant(tenantSlug);
  if (!tenant) return {};

  return {
    title: `${tenant.name} — Shop`,
    description: tenant.tagline,
  };
}
