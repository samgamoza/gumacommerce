import { resolveShopThemeForPlan } from "@guma-commerce/storefront-themes";
import { products } from "@/lib/store-data";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { DEFAULT_STOREFRONT_SETTINGS } from "@/lib/storefront-settings";

export const MODEL_STORE_SLUG = "model";

const CATEGORY_LABELS: Record<string, string> = {
  fashion: "Fashion",
  beauty: "Beauty",
  tech: "Tech",
  home: "Home",
  fitness: "Fitness",
  accessories: "Accessories",
};

export function getModelStoreTenant(): DemoTenant {
  const shopTheme = resolveShopThemeForPlan(
    {
      templateId: "clean-guma",
      tagline: "Shop the feed. Checkout in a tap.",
      promoTitle: "Free delivery on orders ₱500+",
      promoSubtitle: "Metro Manila · Until 9 PM",
      primaryColor: "#e8554e",
      accentColor: "#f97316",
    },
    "Guma AI-commerce",
    "pro"
  );

  const mappedProducts: DemoProduct[] = products.map((product) => ({
    id: product.id,
    slug: product.id,
    title: product.name,
    shortDescription: `${product.rating}★ · ${product.sold.toLocaleString("en-PH")} sold`,
    price: product.price,
    compareAtPrice: product.originalPrice,
    image: product.image,
    category: CATEGORY_LABELS[product.category] ?? product.category,
    categorySlug: product.category,
    tags: product.badge ? [product.badge] : [],
  }));

  const shopCategories = [...new Set(products.map((p) => p.category))].map((slug) => ({
    id: slug,
    name: CATEGORY_LABELS[slug] ?? slug,
    slug,
  }));

  return {
    slug: MODEL_STORE_SLUG,
    name: "Guma AI-commerce",
    tagline: shopTheme.tagline,
    category: "Marketplace",
    location: "Philippines",
    logoEmoji: "✨",
    theme: {
      primaryColor: shopTheme.primaryColor,
      accentColor: shopTheme.accentColor,
    },
    shopTheme,
    shopCategories,
    codEnabled: true,
    subscriptionPlan: "pro",
    storeSettings: {
      ...DEFAULT_STOREFRONT_SETTINGS,
      shopAssistant: {
        enabled: true,
        name: "Guma Assistant",
        greeting: "Hi! Need help finding something?",
        tone: "friendly_taglish",
        humanInbox: true,
      },
    },
    products: mappedProducts,
  };
}
