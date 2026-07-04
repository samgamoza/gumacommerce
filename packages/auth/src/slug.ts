const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "blog",
  "careers",
  "checkout",
  "contact",
  "demo",
  "faq",
  "help",
  "login",
  "onboarding",
  "orders",
  "pricing",
  "privacy",
  "products",
  "refunds",
  "signup",
  "status",
  "terms",
  "verify-email",
  "www",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function validateSlug(slug: string): { ok: true } | { ok: false; reason: string } {
  if (slug.length < 3) {
    return { ok: false, reason: "Shop URL must be at least 3 characters." };
  }
  if (slug.length > 32) {
    return { ok: false, reason: "Shop URL must be 32 characters or less." };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      reason: "Use lowercase letters, numbers, and hyphens only (e.g. halo-queen).",
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, reason: "This shop URL is reserved. Please choose another." };
  }
  return { ok: true };
}

export function slugFromShopName(name: string): string {
  return normalizeSlug(name);
}
