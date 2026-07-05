/**
 * Client-safe plan catalog for UI dropdowns.
 *
 * The authoritative catalog (with features + pricing used for MRR math) lives
 * in `@guma-commerce/db` as `PLATFORM_PLANS`. That module pulls in the Postgres
 * driver, so it cannot be imported from client components — keep this list in
 * sync with it for the small subset the client needs.
 */
export interface ClientPlan {
  id: string;
  name: string;
  priceMonthly: number;
}

export const CLIENT_PLANS: ClientPlan[] = [
  { id: "free", name: "Free", priceMonthly: 0 },
  { id: "starter", name: "Starter", priceMonthly: 499 },
  { id: "growth", name: "Growth", priceMonthly: 1499 },
  { id: "pro", name: "Pro", priceMonthly: 2999 },
];
