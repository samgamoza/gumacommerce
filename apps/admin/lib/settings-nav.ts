export const SETTINGS_SECTIONS = [
  { href: "/settings/shop", label: "Shop", icon: "🏪", description: "Name, locale, and storefront basics" },
  {
    href: "/settings/delivery-shipping",
    label: "Delivery & Shipping",
    icon: "🚚",
    description: "COD, fees, and fulfillment",
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    icon: "🔔",
    description: "Email and SMS alerts",
  },
  {
    href: "/settings/subscription",
    label: "Subscription",
    icon: "💳",
    description: "Your Guma One plan",
  },
  {
    href: "/settings/wallet",
    label: "Wallet & payouts",
    icon: "💰",
    description: "Balance, withdrawals, and fund requests",
  },
  {
    href: "/settings/kyc",
    label: "KYC verification",
    icon: "🪪",
    description: "Identity verification for payouts",
  },
  {
    href: "/settings/account",
    label: "Password & security",
    icon: "🔐",
    description: "Login, password, and account access",
  },
  {
    href: "/settings/whatsapp-agent",
    label: "WhatsApp Agent",
    icon: "💬",
    description: "Auto-replies and order chat",
  },
  {
    href: "/settings/tracking",
    label: "Tracking",
    icon: "📊",
    description: "Pixels and analytics IDs",
  },
  {
    href: "/settings/support",
    label: "Help & support",
    icon: "🆘",
    description: "Contact Guma One support",
  },
] as const;

export type SettingsSectionHref = (typeof SETTINGS_SECTIONS)[number]["href"];

export function getSettingsSectionTitle(pathname: string): string | null {
  const section = SETTINGS_SECTIONS.find((item) => item.href === pathname);
  return section?.label ?? null;
}
