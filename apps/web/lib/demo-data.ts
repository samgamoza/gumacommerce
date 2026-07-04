import { DEFAULT_STOREFRONT_SETTINGS } from "./storefront-settings";

export interface DemoProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: string;
  categorySlug?: string;
  tags: string[];
}

export interface DemoTenant {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  location: string;
  logoEmoji: string;
  logoUrl?: string;
  theme: { primaryColor: string; accentColor: string };
  shopTheme: import("@guma-commerce/storefront-themes").ResolvedShopTheme;
  shopCategories: Array<{ id: string; name: string; slug: string }>;
  coverUrl?: string;
  codEnabled: boolean;
  storeSettings: import("./storefront-settings").StorefrontStoreSettings;
  products: DemoProduct[];
}

export const DEMO_TENANT: DemoTenant = {
  slug: "demo",
  name: "Halo Queen Manila",
  tagline: "Premium halo-halo, delivered ice-cold 🍧",
  category: "Food & Beverage",
  location: "Metro Manila",
  logoEmoji: "🍧",
  theme: { primaryColor: "#059669", accentColor: "#f59e0b" },
  shopTheme: {
    templateId: "neon-bazaar",
    tier: "standard",
    label: "Neon Bazaar",
    layout: "bento",
    header: "floating-glass",
    card: "glass-tile",
    hero: "mesh",
    tagline: "Premium halo-halo, delivered ice-cold 🍧",
    promoTitle: "Barkada bucket sale — 4 cups ₱499",
    promoSubtitle: "Order before 8 PM for same-day delivery",
    primaryColor: "#a855f7",
    accentColor: "#22d3ee",
    background: "#020617",
    foreground: "#f8fafc",
    cardBackground: "rgba(15, 23, 42, 0.72)",
    muted: "#94a3b8",
    border: "rgba(148, 163, 184, 0.25)",
    mode: "dark",
    radius: "1rem",
    displayFont: "mono-accent",
    previewGradient: "linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #22d3ee 100%)",
  },
  codEnabled: true,
  storeSettings: {
    ...DEFAULT_STOREFRONT_SETTINGS,
    delivery: {
      ...DEFAULT_STOREFRONT_SETTINGS.delivery,
      flatRate: 89,
      freeDeliveryMin: 500,
    },
    whatsapp: {
      enabled: true,
      phone: "+639171234567",
      greeting: "Hi! Order your halo-halo here:",
    },
  },
  shopCategories: [
    { id: "demo-best", name: "Best Sellers", slug: "best-sellers" },
    { id: "demo-specials", name: "Specials", slug: "specials" },
    { id: "demo-classics", name: "Classics", slug: "classics" },
  ],
  products: [
    {
      id: "1",
      slug: "premium-halo-halo",
      title: "Premium Halo-Halo",
      shortDescription: "Loaded with ube, leche flan, and fresh fruits",
      price: 149,
      compareAtPrice: 179,
      image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80",
      category: "Best Sellers",
      categorySlug: "best-sellers",
      tags: ["bestseller", "summer"],
    },
    {
      id: "2",
      slug: "ube-special",
      title: "Ube Special Halo-Halo",
      shortDescription: "Extra ube halaya for ube lovers",
      price: 169,
      image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
      category: "Specials",
      categorySlug: "specials",
      tags: ["ube"],
    },
    {
      id: "3",
      slug: "family-bucket",
      title: "Family Bucket (4 cups)",
      shortDescription: "Perfect for barkada nights",
      price: 499,
      compareAtPrice: 596,
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80",
      category: "Bundles",
      categorySlug: "specials",
      tags: ["bundle", "family"],
    },
    {
      id: "4",
      slug: "mais-con-yelo",
      title: "Mais Con Yelo",
      shortDescription: "Classic corn and milk refreshment",
      price: 99,
      image: "https://images.unsplash.com/photo-1625944525533-473f1a9d2c69?w=600&q=80",
      category: "Classics",
      categorySlug: "classics",
      tags: ["classic"],
    },
  ],
};

export function getTenant(slug: string): DemoTenant | null {
  if (slug === "demo" || slug === "haloqueen") {
    return { ...DEMO_TENANT, slug };
  }
  return null;
}

export function getProduct(tenant: DemoTenant, productSlug: string): DemoProduct | undefined {
  return tenant.products.find((p) => p.slug === productSlug);
}

export function getStorefrontUrl(slug: string, path = ""): string {
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";
  return `${base}/${slug}${path}`;
}

export function getOrderLink(slug: string, utm?: Record<string, string>): string {
  const url = new URL(getStorefrontUrl(slug));
  if (utm) {
    Object.entries(utm).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}
