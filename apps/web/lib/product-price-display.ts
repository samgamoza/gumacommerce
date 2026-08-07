import {
  resolveCommerceChrome,
  resolveProductPriceDisplay,
  type ProductPricingMeta,
} from "@guma-commerce/storefront-themes";

const php = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
});

export function formatPhpMoney(amount: number): string {
  return php.format(amount);
}

/** Card/grid/PDP pricing chrome for a product under a shop category. */
export function productCardPricing(
  category: string | null | undefined,
  product: {
    price: number;
    compareAtPrice?: number;
    pricingMeta?: ProductPricingMeta | null;
    title?: string;
    slug?: string;
  },
  formatMoney: (n: number) => string = formatPhpMoney
) {
  return resolveProductPriceDisplay({
    category,
    basePrice: product.price,
    compareAtPrice: product.compareAtPrice,
    meta: product.pricingMeta,
    formatMoney,
    title: product.title,
    slug: product.slug,
  });
}

export function productCardCtaLabel(category: string | null | undefined): string {
  return resolveCommerceChrome(category).addLabel;
}
