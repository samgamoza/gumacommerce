import type { DemoProduct } from "@/lib/demo-data";

export function formatStudioPrice(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function studioBrandName(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first || name;
}

export function studioPhone(tenant: {
  storeSettings: { whatsapp: { enabled: boolean; phone?: string } };
}): string | null {
  const { whatsapp } = tenant.storeSettings;
  return whatsapp.enabled && whatsapp.phone ? whatsapp.phone : null;
}

/** Session vs print/signage package label for pricing display. */
export function studioPackageUnit(product: DemoProduct): string {
  const haystack = `${product.category} ${product.title} ${product.shortDescription}`.toLowerCase();
  if (/print|sign|banner|poster|canvas|signage|vinyl|frame/i.test(haystack)) return "/package";
  return "/session";
}

export function isPrintPackage(product: DemoProduct): boolean {
  return studioPackageUnit(product) === "/package";
}

export const STUDIO_DEFAULT_PRIMARY = "#1d1d1d";
export const STUDIO_DEFAULT_ACCENT = "#838383";

export const STUDIO_HERO_SLIDES = [
  {
    title: "Believe you can create",
    subtitle: "Portrait, wedding, and commercial sessions crafted with intention.",
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77ee70?w=1600&q=80",
  },
  {
    title: "Stories in every frame",
    subtitle: "Editorial photography for brands, couples, and creative professionals.",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&q=80",
  },
  {
    title: "Print & signage, delivered",
    subtitle: "Canvas prints, event signage, and retail displays — designed to impress.",
    image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1600&q=80",
  },
] as const;

export const STUDIO_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1493863641943-9b67192f0b0e?w=800&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc1ee7f?w=800&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80",
] as const;

export const STUDIO_SERVICES = [
  {
    title: "Session Photography",
    description: "Portrait, wedding, and studio sessions with professional retouching included.",
    icon: "camera" as const,
  },
  {
    title: "Commercial & Brand",
    description: "Product, lifestyle, and campaign imagery for agencies and growing brands.",
    icon: "aperture" as const,
  },
  {
    title: "Print & Signage",
    description: "Canvas prints, banners, storefront signage, and event backdrops — ready to install.",
    icon: "print" as const,
  },
] as const;

export const STUDIO_PACKAGE_TABS = [
  { id: "all", label: "All Packages" },
  { id: "sessions", label: "Photo Sessions" },
  { id: "print", label: "Print & Signage" },
] as const;

export type StudioPackageTabId = (typeof STUDIO_PACKAGE_TABS)[number]["id"];
