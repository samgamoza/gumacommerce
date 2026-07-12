export const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

/**
 * GUMA storefront runs on :3010 in local monorepo. :3000 is often a legacy
 * sari-link process that shares the DB but not uploaded product images.
 */
function resolveStorefrontBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";
  if (/^https?:\/\/(localhost|127\.0\.0\.1):3000\b/i.test(raw)) {
    return "http://localhost:3010";
  }
  return raw;
}

export const storefrontBaseUrl = resolveStorefrontBaseUrl();

/** Host shown in signup (e.g. gumacommerce.ph/demo) */
export function shopUrlDisplayPrefix(): string {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "gumacommerce.ph";
  const host = root.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // Keep display host aligned with local storefront port.
  if (/^(localhost|127\.0\.0\.1):3000$/i.test(host)) return "localhost:3010/";
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
