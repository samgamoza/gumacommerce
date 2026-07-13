import {
  checkoutFromLegacySettings,
  normalizeCheckoutJson,
  type TenantCheckoutJson,
} from "@guma-commerce/db/checkout";
import {
  isPickupEnabled,
  legacyDeliveryFromShipping,
  normalizeShippingJson,
  resolveShippingFee,
  shippingFromLegacyDelivery,
  type TenantShippingJson,
} from "@guma-commerce/db/shipping";

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
    pickupAddress: string;
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
  checkout: TenantCheckoutJson;
  shipping: TenantShippingJson;
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
    pickupAddress: "",
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
  checkout: checkoutFromLegacySettings({
    codEnabled: true,
    minOrderAmount: 99,
    autoAcceptOrders: false,
  }),
  shipping: shippingFromLegacyDelivery({
    provider: "manual",
    flatRate: 89,
    freeDeliveryMin: 500,
    pickupEnabled: true,
  }),
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
  currency = "PHP",
  checkoutPublishedJson?: TenantCheckoutJson | null,
  shippingPublishedJson?: TenantShippingJson | null
): StorefrontStoreSettings {
  const defaults = DEFAULT_STOREFRONT_SETTINGS;
  const checkout = checkoutPublishedJson
    ? normalizeCheckoutJson(checkoutPublishedJson)
    : checkoutFromLegacySettings(settingsJson);
  const shipping = shippingPublishedJson
    ? normalizeShippingJson(shippingPublishedJson)
    : shippingFromLegacyDelivery(settingsJson?.delivery);
  const mirrored = legacyDeliveryFromShipping(shipping);

  return {
    codEnabled: checkout.codEnabled ?? settingsJson?.codEnabled ?? defaults.codEnabled,
    minOrderAmount:
      checkout.minOrderAmount ?? settingsJson?.minOrderAmount ?? defaults.minOrderAmount,
    autoAcceptOrders:
      checkout.autoAcceptOrders ??
      settingsJson?.autoAcceptOrders ??
      defaults.autoAcceptOrders,
    currency,
    delivery: {
      provider: mirrored.provider,
      flatRate: mirrored.flatRate,
      freeDeliveryMin: mirrored.freeDeliveryMin,
      pickupEnabled: isPickupEnabled(shipping),
      deliveryNotes: mirrored.deliveryNotes || (settingsJson?.delivery?.deliveryNotes ?? ""),
      pickupAddress: mirrored.pickupAddress || (settingsJson?.delivery?.pickupAddress ?? ""),
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
    checkout,
    shipping,
  };
}

export function computeDeliveryFee(
  subtotal: number,
  settings: StorefrontStoreSettings,
  address?: { city?: string; barangay?: string; province?: string; postalCode?: string }
): number {
  const resolved = resolveShippingFee({
    shipping: settings.shipping,
    subtotal,
    city: address?.city,
    barangay: address?.barangay,
    province: address?.province,
    postalCode: address?.postalCode,
  });
  return resolved.fee;
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
