export const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

export const storefrontBaseUrl =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

/** Host shown in signup (e.g. gumacommerce.ph/demo) */
export function shopUrlDisplayPrefix(): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "gumacommerce.ph";
  const host = root.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `${host}/`;
}

export function storefrontUrl(slug: string, path = ""): string {
  return `${storefrontBaseUrl}/${slug}${path}`;
}

/** Admin-owned concept storefront — optional ref for upgrade-funnel attribution. */
export function modelStoreUrl(ref?: string): string {
  const base = `${storefrontBaseUrl}/model`;
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}
