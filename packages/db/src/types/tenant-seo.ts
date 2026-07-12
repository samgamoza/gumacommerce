/**
 * Tenant SEO payload — draft and published share the same shape.
 * Storefront reads seo_published_json only.
 */
export interface TenantSeoJson {
  /** Site / document title */
  siteTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  /** Absolute or path-relative canonical URL */
  canonicalUrl?: string;
  /** robots meta / robots.txt directives */
  robots?: {
    index?: boolean;
    follow?: boolean;
    /** Extra robots.txt lines (one per string) */
    extraRules?: string[];
  };
  openGraph?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    type?: string;
  };
  twitter?: {
    card?: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  /** JSON-LD blocks (Organization / WebSite / etc.) */
  jsonLd?: Record<string, unknown>[];
  /** Optional AI rationale when suggested */
  rationale?: string;
}

export const EMPTY_SEO: TenantSeoJson = {
  siteTitle: "",
  metaDescription: "",
  keywords: [],
  canonicalUrl: "",
  robots: { index: true, follow: true, extraRules: [] },
  openGraph: { title: "", description: "", imageUrl: "", type: "website" },
  twitter: {
    card: "summary_large_image",
    title: "",
    description: "",
    imageUrl: "",
  },
  jsonLd: [],
};

export function normalizeSeoJson(input: unknown): TenantSeoJson {
  if (!input || typeof input !== "object") return { ...EMPTY_SEO };
  const raw = input as Record<string, unknown>;
  const robots =
    raw.robots && typeof raw.robots === "object"
      ? (raw.robots as TenantSeoJson["robots"])
      : EMPTY_SEO.robots;
  const openGraph =
    raw.openGraph && typeof raw.openGraph === "object"
      ? (raw.openGraph as TenantSeoJson["openGraph"])
      : EMPTY_SEO.openGraph;
  const twitter =
    raw.twitter && typeof raw.twitter === "object"
      ? (raw.twitter as TenantSeoJson["twitter"])
      : EMPTY_SEO.twitter;

  return {
    siteTitle: typeof raw.siteTitle === "string" ? raw.siteTitle : "",
    metaDescription: typeof raw.metaDescription === "string" ? raw.metaDescription : "",
    keywords: Array.isArray(raw.keywords)
      ? raw.keywords.filter((k): k is string => typeof k === "string")
      : [],
    canonicalUrl: typeof raw.canonicalUrl === "string" ? raw.canonicalUrl : "",
    robots: {
      index: robots?.index !== false,
      follow: robots?.follow !== false,
      extraRules: Array.isArray(robots?.extraRules)
        ? robots!.extraRules!.filter((r): r is string => typeof r === "string")
        : [],
    },
    openGraph: {
      title: openGraph?.title ?? "",
      description: openGraph?.description ?? "",
      imageUrl: openGraph?.imageUrl ?? "",
      type: openGraph?.type ?? "website",
    },
    twitter: {
      card: twitter?.card === "summary" ? "summary" : "summary_large_image",
      title: twitter?.title ?? "",
      description: twitter?.description ?? "",
      imageUrl: twitter?.imageUrl ?? "",
    },
    jsonLd: Array.isArray(raw.jsonLd)
      ? raw.jsonLd.filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
      : [],
    rationale: typeof raw.rationale === "string" ? raw.rationale : undefined,
  };
}
