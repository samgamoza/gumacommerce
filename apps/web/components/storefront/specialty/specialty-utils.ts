import type { DemoProduct, DemoTenant } from "@/lib/demo-data";

export function formatSpecialtyPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function specialtyPhone(tenant: DemoTenant): string | null {
  const { whatsapp } = tenant.storeSettings;
  return whatsapp.enabled && whatsapp.phone ? whatsapp.phone : null;
}

/** Flagship offer: main product, else first product. */
export function resolveFlagshipProduct(products: DemoProduct[]): DemoProduct | null {
  if (!products.length) return null;
  return products.find((p) => p.isMain) ?? products[0] ?? null;
}

export function resolveSecondaryProducts(products: DemoProduct[], flagshipId?: string): DemoProduct[] {
  return products.filter((p) => p.id !== flagshipId).slice(0, 4);
}
