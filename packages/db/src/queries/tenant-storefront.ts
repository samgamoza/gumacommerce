import { eq } from "drizzle-orm";
import { getDb } from "../client";
import { tenants } from "../schema/index";

export interface TenantStorefrontSettings {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  subscriptionPlan: string | null;
  themeJson: {
    templateId?: string;
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    tagline?: string;
    promoTitle?: string;
    promoSubtitle?: string;
  } | null;
}

export interface UpdateTenantStorefrontInput {
  templateId?: string;
  primaryColor?: string;
  accentColor?: string;
  tagline?: string;
  promoTitle?: string;
  promoSubtitle?: string;
  coverUrl?: string | null;
  logoUrl?: string | null;
}

export async function getTenantStorefrontSettings(
  tenantId: string
): Promise<TenantStorefrontSettings | null> {
  const db = getDb();
  const [tenant] = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      category: tenants.category,
      logoUrl: tenants.logoUrl,
      coverUrl: tenants.coverUrl,
      subscriptionPlan: tenants.subscriptionPlan,
      themeJson: tenants.themeJson,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return tenant ?? null;
}

export async function updateTenantStorefront(
  tenantId: string,
  input: UpdateTenantStorefrontInput
): Promise<TenantStorefrontSettings | null> {
  const db = getDb();
  const [existing] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!existing) return null;

  const currentTheme = existing.themeJson ?? {};
  const nextTheme = {
    ...currentTheme,
    ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
    ...(input.primaryColor !== undefined ? { primaryColor: input.primaryColor } : {}),
    ...(input.accentColor !== undefined ? { accentColor: input.accentColor } : {}),
    ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
    ...(input.promoTitle !== undefined ? { promoTitle: input.promoTitle } : {}),
    ...(input.promoSubtitle !== undefined ? { promoSubtitle: input.promoSubtitle } : {}),
  };

  await db
    .update(tenants)
    .set({
      themeJson: nextTheme,
      ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  return getTenantStorefrontSettings(tenantId);
}
