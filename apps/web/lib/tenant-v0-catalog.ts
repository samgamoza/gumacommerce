import type { Product, Review } from "@/lib/store-data";
import type { DemoProduct, DemoTenant } from "@/lib/demo-data";
import { STOREFRONT_REVIEW_SEEDS } from "@/lib/storefront-review-seeds";

function pseudoRating(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * 7) % 97;
  return 4.5 + (hash % 5) / 10;
}

function pseudoSold(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * 11) % 997;
  return 400 + hash * 13;
}

export function toV0Product(product: DemoProduct): Product {
  const hasDeal =
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const badgeTag = product.tags[0];
  let badge: Product["badge"];
  if (badgeTag?.toLowerCase().includes("deal") || hasDeal) badge = "Deal";
  else if (badgeTag?.toLowerCase().includes("new")) badge = "New";
  else if (badgeTag?.toLowerCase().includes("best")) badge = "Bestseller";

  return {
    id: product.id,
    name: product.title,
    price: product.price,
    originalPrice: product.compareAtPrice,
    image: product.image,
    category: product.categorySlug ?? product.category.toLowerCase(),
    rating: pseudoRating(product.id),
    reviews: Math.floor(pseudoSold(product.id) / 4),
    sold: pseudoSold(product.id),
    badge,
  };
}

export interface TenantV0Catalog {
  all: Product[];
  featured: Product[];
  deals: Product[];
  newArrivals: Product[];
  popular: Product[];
  liveProduct: Product | null;
  reviews: Review[];
  categories: Array<{ id: string; label: string; emoji?: string }>;
}

export function buildTenantV0Catalog(tenant: DemoTenant): TenantV0Catalog {
  const all = tenant.products.map(toV0Product);
  const deals = all.filter((p) => p.badge === "Deal" || p.originalPrice);
  const newArrivals = all.filter((p) => p.badge === "New").length
    ? all.filter((p) => p.badge === "New")
    : [...all].reverse().slice(0, 4);
  const popular = [...all].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const featured = all.slice(0, 6);

  const categories =
    tenant.shopCategories.length > 0
      ? [
          { id: "all", label: "All", emoji: "✨" },
          ...tenant.shopCategories.map((c) => ({ id: c.slug, label: c.name })),
        ]
      : [
          { id: "all", label: "All", emoji: "✨" },
          ...[...new Set(tenant.products.map((p) => p.category))].map((name) => ({
            id: name.toLowerCase().replace(/\s+/g, "-"),
            label: name,
          })),
        ];

  const platforms: Review["platform"][] = ["Facebook", "Instagram", "TikTok", "Facebook"];
  const reviews: Review[] = STOREFRONT_REVIEW_SEEDS.map((seed, i) => ({
    id: seed.id,
    name: seed.name.replace(".", ""),
    handle: `@${seed.name.toLowerCase().replace(/[^a-z]/g, "")}`,
    platform: platforms[i % platforms.length]!,
    rating: seed.rating,
    text: seed.text.replace("seller", tenant.name),
    product: seed.product,
  }));

  return {
    all,
    featured,
    deals: deals.length ? deals.slice(0, 4) : all.slice(0, 4),
    newArrivals: newArrivals.slice(0, 4),
    popular,
    liveProduct: deals[0] ?? all[0] ?? null,
    reviews,
    categories,
  };
}
