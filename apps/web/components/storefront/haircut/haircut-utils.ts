import type { DemoProduct, DemoTenant } from "@/lib/demo-data";

export function formatHaircutPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function haircutPhone(tenant: DemoTenant): string | null {
  const { whatsapp } = tenant.storeSettings;
  return whatsapp.enabled && whatsapp.phone ? whatsapp.phone : null;
}

export function haircutBrandName(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first || name;
}

export const HAIRCUT_HERO_SLIDES = [
  {
    title: "We Will Keep You An Awesome Look",
    subtitle: "Premium cuts, fades, and grooming — book your chair online.",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&q=80",
  },
  {
    title: "Luxury Haircut at Affordable Price",
    subtitle: "Walk-ins welcome · Appointments preferred · Local barbers you trust.",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80",
  },
] as const;

export const HAIRCUT_SERVICE_ICONS = ["scissors", "razor", "sparkles", "droplets"] as const;

export function serviceIconForProduct(product: DemoProduct, index: number) {
  const hay = `${product.title} ${product.category}`.toLowerCase();
  if (/beard|shave|trim/i.test(hay)) return "razor" as const;
  if (/color|dye|highlight|treatment|spa/i.test(hay)) return "droplets" as const;
  if (/style|wash|blow|bridal|makeup/i.test(hay)) return "sparkles" as const;
  return HAIRCUT_SERVICE_ICONS[index % HAIRCUT_SERVICE_ICONS.length];
}
