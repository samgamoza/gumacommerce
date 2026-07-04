export interface StorefrontStoreSettings {
  codEnabled: boolean;
  minOrderAmount: number;
  autoAcceptOrders: boolean;
  currency: string;
  delivery: {
    provider: "lalamove" | "grab" | "manual";
    flatRate: number;
    freeDeliveryMin: number;
    pickupEnabled: boolean;
    deliveryNotes: string;
  };
  whatsapp: {
    enabled: boolean;
    phone: string;
    greeting: string;
  };
  tracking: {
    facebookPixelId: string;
    googleAnalyticsId: string;
    tiktokPixelId: string;
  };
  shopAssistant: {
    enabled: boolean;
    name: string;
    greeting: string;
    tone: "friendly_taglish" | "professional_en" | "gen_z_taglish";
  };
}

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontStoreSettings = {
  codEnabled: true,
  minOrderAmount: 99,
  autoAcceptOrders: false,
  currency: "PHP",
  delivery: {
    provider: "manual",
    flatRate: 89,
    freeDeliveryMin: 500,
    pickupEnabled: true,
    deliveryNotes: "",
  },
  whatsapp: {
    enabled: false,
    phone: "",
    greeting: "Hi! Thanks for messaging us. Place your order here:",
  },
  tracking: {
    facebookPixelId: "",
    googleAnalyticsId: "",
    tiktokPixelId: "",
  },
  shopAssistant: {
    enabled: true,
    name: "Shop Assistant",
    greeting: "Hi! 👋 Ask me about products, delivery, or payment before you order.",
    tone: "friendly_taglish",
  },
};

type SettingsJson = {
  codEnabled?: boolean;
  autoAcceptOrders?: boolean;
  minOrderAmount?: number;
  delivery?: Partial<StorefrontStoreSettings["delivery"]>;
  whatsapp?: Partial<StorefrontStoreSettings["whatsapp"]>;
  tracking?: Partial<StorefrontStoreSettings["tracking"]>;
  shopAssistant?: Partial<StorefrontStoreSettings["shopAssistant"]>;
};

export function resolveStorefrontSettings(
  settingsJson?: SettingsJson | null,
  currency = "PHP"
): StorefrontStoreSettings {
  const defaults = DEFAULT_STOREFRONT_SETTINGS;

  return {
    codEnabled: settingsJson?.codEnabled ?? defaults.codEnabled,
    minOrderAmount: settingsJson?.minOrderAmount ?? defaults.minOrderAmount,
    autoAcceptOrders: settingsJson?.autoAcceptOrders ?? defaults.autoAcceptOrders,
    currency,
    delivery: {
      provider: settingsJson?.delivery?.provider ?? defaults.delivery.provider,
      flatRate: settingsJson?.delivery?.flatRate ?? defaults.delivery.flatRate,
      freeDeliveryMin:
        settingsJson?.delivery?.freeDeliveryMin ?? defaults.delivery.freeDeliveryMin,
      pickupEnabled: settingsJson?.delivery?.pickupEnabled ?? defaults.delivery.pickupEnabled,
      deliveryNotes: settingsJson?.delivery?.deliveryNotes ?? defaults.delivery.deliveryNotes,
    },
    whatsapp: {
      enabled: settingsJson?.whatsapp?.enabled ?? defaults.whatsapp.enabled,
      phone: settingsJson?.whatsapp?.phone ?? defaults.whatsapp.phone,
      greeting: settingsJson?.whatsapp?.greeting ?? defaults.whatsapp.greeting,
    },
    tracking: {
      facebookPixelId:
        settingsJson?.tracking?.facebookPixelId ?? defaults.tracking.facebookPixelId,
      googleAnalyticsId:
        settingsJson?.tracking?.googleAnalyticsId ?? defaults.tracking.googleAnalyticsId,
      tiktokPixelId: settingsJson?.tracking?.tiktokPixelId ?? defaults.tracking.tiktokPixelId,
    },
    shopAssistant: {
      enabled: settingsJson?.shopAssistant?.enabled ?? defaults.shopAssistant.enabled,
      name: settingsJson?.shopAssistant?.name ?? defaults.shopAssistant.name,
      greeting: settingsJson?.shopAssistant?.greeting ?? defaults.shopAssistant.greeting,
      tone: settingsJson?.shopAssistant?.tone ?? defaults.shopAssistant.tone,
    },
  };
}

export function computeDeliveryFee(
  subtotal: number,
  settings: StorefrontStoreSettings
): number {
  if (settings.delivery.freeDeliveryMin > 0 && subtotal >= settings.delivery.freeDeliveryMin) {
    return 0;
  }
  return settings.delivery.flatRate;
}

export function deliveryProviderLabel(provider: StorefrontStoreSettings["delivery"]["provider"]) {
  switch (provider) {
    case "lalamove":
      return "Lalamove delivery";
    case "grab":
      return "GrabExpress delivery";
    default:
      return "Delivery fee";
  }
}

export function whatsappChatUrl(phone: string, text?: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const url = new URL(`https://wa.me/${digits}`);
  if (text?.trim()) url.searchParams.set("text", text.trim());
  return url.toString();
}
