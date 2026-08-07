import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateStockByKey } from "@guma-commerce/db";
import { isShopTemplateId, normalizeStoreLook, resolveStockSkin } from "@guma-commerce/storefront-themes";
import { TenantStorefrontHome } from "@/components/storefront/tenant-storefront-home";
import { getOpsStockPreviewTenant } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ stockKey: string }>;
}

/**
 * Ops-only Template Intel preview: renders a seeded/published stock skin
 * on the matching live demo renderer (with stock skin colors + storeLook).
 * Does not require NEXT_PUBLIC_ENABLE_DEMO_SHOP.
 */
export default async function OpsStockPreviewPage({ params }: PageProps) {
  const { stockKey: rawKey } = await params;
  const stockKey = decodeURIComponent(rawKey).trim().toLowerCase();
  if (!stockKey) notFound();

  const row = await getTemplateStockByKey(stockKey);
  if (!row || row.status === "archived") notFound();
  if (!isShopTemplateId(row.liveTemplateId)) notFound();

  const skin = resolveStockSkin(row.storeLookJson, row.stockKey);
  const storeLook = normalizeStoreLook(skin);

  const tenant = getOpsStockPreviewTenant({
    liveTemplateId: row.liveTemplateId,
    label: row.label,
    categoryLabel: row.categoryLabel,
    storeLook,
    primaryColor: skin.primaryColor,
    accentColor: skin.accentColor,
    displayFont: skin.displayFont,
    radius: skin.radius,
  });
  if (!tenant) notFound();

  const statusLabel =
    row.status === "published"
      ? "Published — already in Launch for this category"
      : row.status === "draft"
        ? "Draft — not in Launch until you Publish in Template Intel"
        : `Status: ${row.status}`;

  return (
    <>
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white">
        <span>
          Ops preview · {row.label} · {row.liveTemplateId} · {skin.paletteId}
        </span>
        <span className="text-xs font-medium text-emerald-100">{statusLabel}</span>
        <Link
          href={
            process.env.NEXT_PUBLIC_PLATFORM_URL
              ? `${process.env.NEXT_PUBLIC_PLATFORM_URL.replace(/\/$/, "")}/templates`
              : "/templates"
          }
          className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs transition hover:bg-white/25"
        >
          ← Template Intel
        </Link>
      </div>
      <TenantStorefrontHome tenant={tenant} />
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { stockKey: rawKey } = await params;
  const row = await getTemplateStockByKey(decodeURIComponent(rawKey).trim().toLowerCase());
  return {
    title: row ? `Preview · ${row.label}` : "Stock preview",
    robots: { index: false, follow: false },
  };
}
