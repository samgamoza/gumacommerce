export interface TenantDeliverySettings {
  provider?: "lalamove" | "grab" | "manual";
  flatRate?: number;
  freeDeliveryMin?: number;
  pickupEnabled?: boolean;
  deliveryNotes?: string;
  /** Full store address used as the courier pickup point (geocoded for quotes). */
  pickupAddress?: string;
}

export interface TenantNotificationSettings {
  emailOnNewOrder?: boolean;
  smsOnNewOrder?: boolean;
  emailOnOrderStatus?: boolean;
  marketingEmails?: boolean;
}

export interface TenantWhatsappSettings {
  enabled?: boolean;
  phone?: string;
  greeting?: string;
  connectedAt?: string;
}

export interface TenantTrackingSettings {
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  tiktokPixelId?: string;
}

export interface TenantShopAssistantSettings {
  enabled?: boolean;
  name?: string;
  greeting?: string;
  tone?: "friendly_taglish" | "professional_en" | "gen_z_taglish";
}

export interface TenantAgentSettings {
  postingEnabled?: boolean;
  campaignEnabled?: boolean;
  postingSchedule?: "daily" | "weekly" | "manual";
  postingTime?: string;
  weeklyDay?: number;
  channels?: Array<"instagram" | "tiktok" | "facebook">;
  lastReminderDate?: string;
}

export interface TenantSettingsJson {
  codEnabled?: boolean;
  autoAcceptOrders?: boolean;
  minOrderAmount?: number;
  delivery?: TenantDeliverySettings;
  notifications?: TenantNotificationSettings;
  whatsapp?: TenantWhatsappSettings;
  tracking?: TenantTrackingSettings;
  shopAssistant?: TenantShopAssistantSettings;
  agents?: TenantAgentSettings;
}

export interface TenantSettingsRecord {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  category: string | null;
  localeDefault: "en" | "fil" | "taglish" | null;
  currency: string;
  timezone: string;
  subscriptionPlan: string | null;
  status: string;
  themeJson: {
    tagline?: string;
    promoTitle?: string;
    promoSubtitle?: string;
  } | null;
  settings: TenantSettingsJson;
}

export interface UpdateTenantSettingsInput {
  name?: string;
  legalName?: string | null;
  category?: string | null;
  localeDefault?: "en" | "fil" | "taglish";
  currency?: string;
  timezone?: string;
  tagline?: string;
  promoTitle?: string;
  promoSubtitle?: string;
  subscriptionPlan?: string;
  settings?: Partial<TenantSettingsJson> & {
    delivery?: Partial<TenantDeliverySettings>;
    notifications?: Partial<TenantNotificationSettings>;
    whatsapp?: Partial<TenantWhatsappSettings>;
    tracking?: Partial<TenantTrackingSettings>;
    shopAssistant?: Partial<TenantShopAssistantSettings>;
    agents?: Partial<TenantAgentSettings>;
  };
}
