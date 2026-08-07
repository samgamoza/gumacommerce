import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const adminUrl =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

export const storefrontUrl =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";

/** Absolute public shop URL (safe to copy-paste into a browser). */
export function shopPublicUrl(slug: string): string {
  const base = storefrontUrl.replace(/\/$/, "");
  return `${base}/${slug.replace(/^\/+/, "")}`;
}

/** Host + path for display (no scheme). */
export function shopPublicUrlLabel(slug: string): string {
  try {
    const u = new URL(shopPublicUrl(slug));
    return `${u.host}${u.pathname}`.replace(/\/$/, "") || u.host;
  } catch {
    return shopPublicUrl(slug);
  }
}

export function modelStoreUrl(ref?: string): string {
  const base = `${storefrontUrl}/model`;
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}
