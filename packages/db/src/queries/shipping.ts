import { eq } from "drizzle-orm";
import { getDb } from "../client";
import { tenants } from "../schema/index";
import {
  EMPTY_SHIPPING,
  legacyDeliveryFromShipping,
  normalizeShippingJson,
  shippingFromLegacyDelivery,
  type TenantShippingJson,
} from "../types/tenant-shipping";

export type { TenantShippingJson };
export {
  EMPTY_SHIPPING,
  normalizeShippingJson,
  shippingFromLegacyDelivery,
  legacyDeliveryFromShipping,
  resolveShippingFee,
  isPickupEnabled,
} from "../types/tenant-shipping";

export interface TenantShippingState {
  tenantId: string;
  slug: string;
  name: string;
  draft: TenantShippingJson;
  published: TenantShippingJson;
}

export async function getTenantShippingState(
  tenantId: string
): Promise<TenantShippingState | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      settingsJson: tenants.settingsJson,
      shippingDraftJson: tenants.shippingDraftJson,
      shippingPublishedJson: tenants.shippingPublishedJson,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!row) return null;

  const legacy = shippingFromLegacyDelivery(row.settingsJson?.delivery);
  const published = row.shippingPublishedJson
    ? normalizeShippingJson(row.shippingPublishedJson)
    : legacy;
  const draft = row.shippingDraftJson
    ? normalizeShippingJson(row.shippingDraftJson)
    : { ...published };

  return {
    tenantId: row.id,
    slug: row.slug,
    name: row.name,
    draft,
    published,
  };
}

export async function saveTenantShippingDraft(
  tenantId: string,
  shipping: TenantShippingJson
): Promise<TenantShippingJson> {
  const db = getDb();
  const normalized = normalizeShippingJson(shipping);
  await db
    .update(tenants)
    .set({ shippingDraftJson: normalized, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
  return normalized;
}

/**
 * Publish shipping config and mirror compact delivery fields into settings_json
 * so existing storefront fee / Lalamove paths stay compatible.
 */
export async function publishTenantShipping(
  tenantId: string,
  shipping: TenantShippingJson
): Promise<TenantShippingJson> {
  const db = getDb();
  const normalized = normalizeShippingJson(shipping);
  const delivery = legacyDeliveryFromShipping(normalized);

  const [row] = await db
    .select({ settingsJson: tenants.settingsJson })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const prev = (row?.settingsJson ?? {}) as Record<string, unknown>;
  const settingsJson = {
    ...prev,
    delivery: {
      ...((prev.delivery as Record<string, unknown> | undefined) ?? {}),
      ...delivery,
    },
  };

  await db
    .update(tenants)
    .set({
      shippingDraftJson: normalized,
      shippingPublishedJson: normalized,
      settingsJson,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  return normalized;
}

export async function getPublishedShippingForSlug(
  slug: string
): Promise<TenantShippingJson | null> {
  const db = getDb();
  const [row] = await db
    .select({
      settingsJson: tenants.settingsJson,
      shippingPublishedJson: tenants.shippingPublishedJson,
      status: tenants.status,
    })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (!row || row.status !== "active") return null;
  if (row.shippingPublishedJson) return normalizeShippingJson(row.shippingPublishedJson);
  return shippingFromLegacyDelivery(row.settingsJson?.delivery);
}
