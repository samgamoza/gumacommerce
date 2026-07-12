/** Storefront owner menu links → admin app routes */

export const OWNER_SHOP_LINKS = [
  { href: "/launch", label: "GUMA Launch" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/orders", label: "Orders" },
] as const;

export const OWNER_BILLING_LINKS = [
  { href: "/settings/subscription", label: "Subscription" },
  { href: "/settings/wallet", label: "Wallet & payouts" },
  { href: "/settings/wallet?action=request", label: "Request funds" },
] as const;

export const OWNER_SETTINGS_LINKS = [
  { href: "/settings/shop", label: "Shop" },
  { href: "/settings/delivery-shipping", label: "Delivery & Shipping" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/account", label: "Password & security" },
  { href: "/settings/kyc", label: "KYC verification" },
  { href: "/settings/whatsapp-agent", label: "WhatsApp Agent" },
  { href: "/settings/tracking", label: "Tracking" },
] as const;

export const OWNER_SUPPORT_LINKS = [
  { href: "/settings/support", label: "Help & support" },
] as const;
