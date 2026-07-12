/**
 * Client-safe plan catalog for UI dropdowns.
 * Keep in sync with packages/db/src/plans.ts (server source of truth).
 *
 * Constitution: free=Free, growth=Pro, pro=Advance
 */
export interface ClientPlan {
  id: string;
  name: string;
  priceMonthly: number;
  constitutionLabel: string;
}

export const CLIENT_PLANS: ClientPlan[] = [
  { id: "free", name: "Free", priceMonthly: 0, constitutionLabel: "Free" },
  { id: "growth", name: "Pro", priceMonthly: 499, constitutionLabel: "Pro" },
  { id: "pro", name: "Advance", priceMonthly: 999, constitutionLabel: "Advance" },
];
