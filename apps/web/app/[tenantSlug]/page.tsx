import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPendingStorefrontTenant,
  getStorefrontTenant,
} from "@/lib/get-storefront-tenant";
import { adminUrl } from "@/lib/utils";
import { TenantStorefrontHome } from "@/components/storefront/tenant-storefront-home";

const UTM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  shop_assistant: "our shop assistant",
};

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
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 text-center hero-glow">
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          <div className="relative flex flex-col items-center">
            <span className="flex h-20 w-20 animate-float items-center justify-center rounded-3xl border border-border/60 bg-card text-4xl shadow-xl">
              🛍️
            </span>
            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Coming soon
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">{pending.name}</h1>
            <p className="mt-2 max-w-sm text-muted-foreground">
              This shop is being set up and isn&apos;t live yet. Check back soon!
            </p>
            <Link
              href={`${adminUrl}/shop-builder`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-emerald-700"
            >
              Design your shop
            </Link>
          </div>
        </div>
      );
    }

    notFound();
  }

  const utmSource = query.utm_source ?? "";

  return (
    <TenantStorefrontHome
      tenant={tenant}
      activeCategorySlug={query.category}
      utmLabel={UTM_LABELS[utmSource] ?? (utmSource || undefined)}
    />
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
