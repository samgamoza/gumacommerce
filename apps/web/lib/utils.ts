import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const adminUrl =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

export const storefrontUrl =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";

export function modelStoreUrl(ref?: string): string {
  const base = `${storefrontUrl}/model`;
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}
