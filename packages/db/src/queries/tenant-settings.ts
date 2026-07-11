import { eq } from "drizzle-orm";
import { getDb } from "../client";
import { tenants } from "../schema/index";
import type {
  TenantSettingsJson,
  TenantSettingsRecord,
  UpdateTenantSettingsInput,
} from "../types/tenant-settings";

function mergeSettings(
  current: TenantSettingsJson | null | undefined,
  patch: UpdateTenantSettingsInput["settings"]
): TenantSettingsJson {
  if (!patch) return current ?? {};

  return {
    ...current,
    ...patch,
    delivery: patch.delivery ? { ...current?.delivery, ...patch.delivery } : current?.delivery,
    notifications: patch.notifications
      ? { ...current?.notifications, ...patch.notifications }
      : current?.notifications,
    whatsapp: patch.whatsapp ? { ...current?.whatsapp, ...patch.whatsapp } : current?.whatsapp,
    tracking: patch.tracking ? { ...current?.tracking, ...patch.tracking } : current?.tracking,
    shopAssistant: patch.shopAssistant
      ? { ...current?.shopAssistant, ...patch.shopAssistant }
      : current?.shopAssistant,
    agents: patch.agents ? { ...current?.agents, ...patch.agents } : current?.agents,
    wallet: patch.wallet ? { ...current?.wallet, ...patch.wallet } : current?.wallet,
  };
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettingsRecord | null> {
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) return null;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    legalName: tenant.legalName,
    category: tenant.category,
    localeDefault: tenant.localeDefault,
    currency: tenant.currency,
    timezone: tenant.timezone,
    subscriptionPlan: tenant.subscriptionPlan,
    status: tenant.status,
    themeJson: tenant.themeJson,
    settings: tenant.settingsJson ?? {},
  };
}

export async function updateTenantSettings(
  tenantId: string,
  input: UpdateTenantSettingsInput
): Promise<TenantSettingsRecord | null> {
  const db = getDb();
  const [existing] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!existing) return null;

  const nextSettings = mergeSettings(existing.settingsJson, input.settings);

  if (input.settings?.whatsapp?.enabled === true) {
    const currentWhatsapp = nextSettings.whatsapp ?? {};
    if (!currentWhatsapp.connectedAt) {
      nextSettings.whatsapp = {
        ...currentWhatsapp,
        connectedAt: new Date().toISOString(),
      };
    }
  }

  if (input.settings?.whatsapp?.enabled === false) {
    nextSettings.whatsapp = {
      ...nextSettings.whatsapp,
      enabled: false,
    };
  }

  const currentTheme = existing.themeJson ?? {};
  const nextTheme = {
    ...currentTheme,
    ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
    ...(input.promoTitle !== undefined ? { promoTitle: input.promoTitle } : {}),
    ...(input.promoSubtitle !== undefined ? { promoSubtitle: input.promoSubtitle } : {}),
  };

  await db
    .update(tenants)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.localeDefault !== undefined ? { localeDefault: input.localeDefault } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.subscriptionPlan !== undefined ? { subscriptionPlan: input.subscriptionPlan } : {}),
      themeJson: nextTheme,
      settingsJson: nextSettings,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  return getTenantSettings(tenantId);
}

export type {
  TenantSettingsJson,
  TenantSettingsRecord,
  UpdateTenantSettingsInput,
} from "../types/tenant-settings";
