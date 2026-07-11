import type { SubscriptionPlan } from "@/lib/plan-access";

export interface DashboardFeatureMeta {
  title: string;
  description: string;
  minPlan: SubscriptionPlan;
  /** Blurred preview cards shown behind the upgrade gate. */
  previewCards: string[];
}

export const DASHBOARD_FEATURES: Record<string, DashboardFeatureMeta> = {
  users: {
    title: "Users",
    description:
      "See every customer who ordered from your shop, tag repeat buyers, and export segments for SMS or email campaigns.",
    minPlan: "growth",
    previewCards: ["Customer list", "Order history", "VIP tags", "Export CSV"],
  },
  analytics: {
    title: "Analytics",
    description:
      "Track storefront visits, add-to-cart rate, checkout conversion, and revenue by product — updated daily.",
    minPlan: "growth",
    previewCards: ["Revenue chart", "Top products", "Traffic sources", "Conversion funnel"],
  },
  integrations: {
    title: "Integrations",
    description:
      "Connect Instagram Shopping, Facebook Catalog, Google Merchant, Lalamove, PayMongo payouts, and more from one place.",
    minPlan: "growth",
    previewCards: ["Meta Catalog", "Google Merchant", "Lalamove", "PayMongo Connect"],
  },
  domains: {
    title: "Domains",
    description:
      "Point your own domain (e.g. shop.yourbrand.ph) at your Guma storefront with automatic SSL.",
    minPlan: "pro",
    previewCards: ["Custom domain", "SSL certificate", "WWW redirect", "DNS helper"],
  },
  workflows: {
    title: "Workflows",
    description:
      "Build automations: auto-accept paid orders, release wallet funds on delivery, send review requests, and more.",
    minPlan: "pro",
    previewCards: ["Order accepted → SMS", "Delivered → wallet release", "Abandoned cart", "Review request"],
  },
  code: {
    title: "Code",
    description:
      "Inject custom CSS, head scripts, and footer embeds for chat widgets, loyalty programs, or advanced tracking.",
    minPlan: "pro",
    previewCards: ["Custom CSS", "Head scripts", "Footer embed", "Theme overrides"],
  },
  logs: {
    title: "Logs",
    description:
      "Audit PayMongo webhooks, payout events, agent runs, and API calls — filterable by date and severity.",
    minPlan: "pro",
    previewCards: ["Payment events", "Webhook log", "Agent runs", "Error stream"],
  },
  api: {
    title: "API",
    description:
      "Issue scoped API keys and configure outbound webhooks for orders, inventory, and wallet events.",
    minPlan: "pro",
    previewCards: ["API keys", "Webhook endpoints", "Rate limits", "OpenAPI spec"],
  },
  security: {
    title: "Security",
    description:
      "Invite staff with role-based access, enforce 2FA, and review a tamper-evident audit log of dashboard actions.",
    minPlan: "growth",
    previewCards: ["Staff roles", "2FA enforcement", "Session log", "IP allowlist"],
  },
};
