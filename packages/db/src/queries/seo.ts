import { eq } from "drizzle-orm";
import { getDb } from "../client";
import { tenants } from "../schema/index";
import {
  EMPTY_SEO,
  normalizeSeoJson,
  type TenantSeoJson,
} from "../types/tenant-seo";

export type { TenantSeoJson };
export { EMPTY_SEO, normalizeSeoJson };

export interface TenantSeoState {
  tenantId: string;
  slug: string;
  name: string;
  category: string | null;
  draft: TenantSeoJson;
  published: TenantSeoJson;
}

export async function getTenantSeoState(tenantId: string): Promise<TenantSeoState | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      category: tenants.category,
      seoDraftJson: tenants.seoDraftJson,
      seoPublishedJson: tenants.seoPublishedJson,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!row) return null;

  const published = normalizeSeoJson(row.seoPublishedJson);
  const draft = row.seoDraftJson
    ? normalizeSeoJson(row.seoDraftJson)
    : { ...published };

  return {
    tenantId: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    draft,
    published,
  };
}

export async function saveTenantSeoDraft(
  tenantId: string,
  seo: TenantSeoJson
): Promise<TenantSeoJson> {
  const db = getDb();
  const normalized = normalizeSeoJson(seo);
  await db
    .update(tenants)
    .set({ seoDraftJson: normalized, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
  return normalized;
}

export async function publishTenantSeo(
  tenantId: string,
  seo: TenantSeoJson
): Promise<TenantSeoJson> {
  const db = getDb();
  const normalized = normalizeSeoJson(seo);
  await db
    .update(tenants)
    .set({
      seoDraftJson: normalized,
      seoPublishedJson: normalized,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));
  return normalized;
}

/** Default SEO seed from shop name/category for AI/manual baselines. */
export function buildDefaultSeo(input: {
  name: string;
  category: string | null;
  slug: string;
  storefrontBaseUrl: string;
}): TenantSeoJson {
  const title = `${input.name} — Shop`;
  const description = input.category
    ? `${input.name} — ${input.category} on Guma Commerce. Order online with COD & e-wallets.`
    : `${input.name} on Guma Commerce. Order online with COD & e-wallets.`;
  const canonical = `${input.storefrontBaseUrl.replace(/\/$/, "")}/${input.slug}`;

  return normalizeSeoJson({
    siteTitle: title,
    metaDescription: description,
    keywords: [input.name, input.category, "Philippines", "online shop"].filter(
      Boolean
    ) as string[],
    canonicalUrl: canonical,
    robots: { index: true, follow: true, extraRules: [] },
    openGraph: {
      title,
      description,
      imageUrl: "",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      imageUrl: "",
    },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        name: input.name,
        url: canonical,
        description,
      },
    ],
  });
}
