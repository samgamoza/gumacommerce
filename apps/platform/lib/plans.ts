/**
 * Client-safe re-export of the canonical plan catalog (ADR D4).
 * Prefer importing `@gumakart/plans` directly in new code.
 */
export { CLIENT_PLANS, SELLER_PLANS } from "@gumakart/plans";

export type ClientPlan = (typeof import("@gumakart/plans").CLIENT_PLANS)[number];
