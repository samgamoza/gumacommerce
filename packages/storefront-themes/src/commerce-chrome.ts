/**
 * Category → buyer chrome (CTA + trust signals).
 * Retail templates can host service verticals without lying ("Fast delivery" on insurance).
 * Ops Template Intelligence grows dedicated skins; this layer keeps language honest today.
 */

export type CommerceMode = "retail" | "service";

export interface CommerceChrome {
  mode: CommerceMode;
  /** Primary product CTA */
  addLabel: string;
  /** After item is in cart */
  inCartLabel: (qty: number) => string;
  checkoutLabel: string;
  trustPrimary: string;
  trustSecondary: string;
  /** Short hint under CTA for service shops */
  ctaHint?: string;
}

const RETAIL_CHROME: CommerceChrome = {
  mode: "retail",
  addLabel: "Add to Cart",
  inCartLabel: (qty) => `${qty} in cart`,
  checkoutLabel: "Checkout now",
  trustPrimary: "Secure payment",
  trustSecondary: "Fast delivery",
};

const SERVICE_CHROME: CommerceChrome = {
  mode: "service",
  addLabel: "Add to inquiry",
  inCartLabel: (qty) => `${qty} in inquiry`,
  checkoutLabel: "Continue inquiry",
  trustPrimary: "Secure inquiry",
  trustSecondary: "Advisor support",
  ctaHint: "No payment yet — this starts a conversation with the seller.",
};

/** Categories that sell advice, bookings, or plans — not shippable retail by default. */
export function isServiceBusinessCategory(category: string): boolean {
  const c = category.trim().toLowerCase();
  if (!c) return false;
  return (
    c.includes("insurance") ||
    c.includes("financial") ||
    c.includes("professional") ||
    c.includes("consult") ||
    c.includes("healthcare") ||
    c.includes("clinic") ||
    c.includes("real estate") ||
    c.includes("property") ||
    c.includes("education") ||
    c.includes("childcare") ||
    c.includes("fitness") ||
    c.includes("wellness") ||
    c.includes("photography") ||
    c.includes("creative") ||
    c.includes("hvac") ||
    c.includes("air conditioning") ||
    c.includes("construction") ||
    c.includes("renovation") ||
    c.includes("home services") ||
    c.includes("trades") ||
    c.includes("appliance") ||
    c.includes("device repair") ||
    c.includes("house painting") ||
    c.includes("decorating") ||
    c.includes("pest control") ||
    c.includes("pest") ||
    c.includes("cleaning") ||
    c.includes("janitorial") ||
    c.includes("landscaping") ||
    c.includes("gardening") ||
    c.includes("lawn") ||
    c.includes("solar") ||
    c.includes("security") ||
    c.includes("surveillance") ||
    c.includes("logistics") ||
    c.includes("shipping") ||
    c.includes("travel") ||
    c.includes("tour") ||
    c.includes("hotel") ||
    c.includes("resort") ||
    c.includes("wedding") ||
    c.includes("events") ||
    c.includes("entertainment") ||
    c.includes("attractions") ||
    c.includes("leisure") ||
    c.includes("camping") ||
    c.includes("adventure") ||
    c.includes("beauty salons") ||
    c.includes("spas") ||
    c.includes("barber") ||
    c.includes("hair salon") ||
    c.includes("car wash") ||
    c.includes("detailing") ||
    c.includes("auto body") ||
    c.includes("auto shop")
  );
}

/**
 * Verticals that still need a dedicated storefront port (beyond mono-market / clean-guma).
 * Used by Template Intelligence priority board — address once, compounds forever.
 */
export const DEDICATED_PORT_PRIORITY: Array<{
  category: string;
  reason: string;
  interimTemplate: string;
  suggestedPorts: string[];
}> = [
  {
    category: "Insurance & Financial Services",
    reason: "Plans & advice — retail cart chrome misleads buyers",
    interimTemplate: "mono-market",
    suggestedPorts: ["insure", "finanza", "ensurance"],
  },
  {
    category: "Healthcare & Clinics",
    reason: "Appointments / care packages need booking language",
    interimTemplate: "mellow",
    suggestedPorts: ["orthoc"],
  },
  {
    category: "Real Estate & Property",
    reason: "Listings & inquiries, not add-to-cart groceries",
    interimTemplate: "mellow",
    suggestedPorts: ["makaan", "property"],
  },
  {
    category: "Professional & Consulting",
    reason: "Services retainers and packages",
    interimTemplate: "mono-market",
    suggestedPorts: ["proman", "prixima"],
  },
  {
    category: "Education & Training",
    reason: "Courses and enrollments",
    interimTemplate: "mono-market",
    suggestedPorts: ["training-studio"],
  },
  {
    category: "Appliance & Device Repair",
    reason: "On-demand repair bookings — not retail cart chrome",
    interimTemplate: "aircon",
    suggestedPorts: ["apex", "aircon"],
  },
  {
    category: "House Painting & Decorating",
    reason: "Quote-based painting jobs need service language",
    interimTemplate: "aircon",
    suggestedPorts: ["painter", "apex"],
  },
  {
    category: "Pest Control",
    reason: "Service visits and treatment packages",
    interimTemplate: "aircon",
    suggestedPorts: ["apex"],
  },
  {
    category: "Wedding Planning & Events",
    reason: "Packages and inquiries, not add-to-cart groceries",
    interimTemplate: "mellow",
    suggestedPorts: ["studio", "mellow"],
  },
];

export function resolveCommerceChrome(category: string | null | undefined): CommerceChrome {
  if (category && isServiceBusinessCategory(category)) {
    return SERVICE_CHROME;
  }
  return RETAIL_CHROME;
}
