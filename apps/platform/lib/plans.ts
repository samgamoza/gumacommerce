/**
 * Client-safe re-export of the canonical plan catalog (ADR D4).
 * Prefer importing `@guma-commerce/plans` directly in new code.
 */
export { CLIENT_PLANS, SELLER_PLANS } from "@guma-commerce/plans";

export type ClientPlan = (typeof import("@guma-commerce/plans").CLIENT_PLANS)[number];
