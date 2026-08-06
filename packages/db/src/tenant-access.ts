/**
 * Pure tenant access helpers — used by storefront, checkout, and seller admin
 * to enforce suspension without duplicating status string checks.
 */

export type TenantLifecycleStatus = "active" | "pending" | "suspended" | string;

export type TenantPublicAccess =
  | { kind: "live" }
  | { kind: "pending"; buyerMessage: string }
  | { kind: "suspended"; buyerMessage: string; sellerMessage: string }
  | { kind: "unavailable"; buyerMessage: string };

export const TENANT_SUSPENDED_BUYER_MESSAGE =
  "This shop is temporarily unavailable. Please contact the seller or try again later.";

export const TENANT_SUSPENDED_SELLER_MESSAGE =
  "Your shop is suspended — contact support at helpdesk or email support to resolve this.";

export const TENANT_PENDING_BUYER_MESSAGE =
  "This shop is being set up and isn't live yet. Check back soon!";

/** Classify a tenant.status value for buyer-facing surfaces. */
export function classifyTenantPublicAccess(
  status: TenantLifecycleStatus | null | undefined
): TenantPublicAccess {
  if (!status) {
    return { kind: "unavailable", buyerMessage: "Shop not found." };
  }
  if (status === "active") return { kind: "live" };
  if (status === "pending") {
    return { kind: "pending", buyerMessage: TENANT_PENDING_BUYER_MESSAGE };
  }
  if (status === "suspended") {
    return {
      kind: "suspended",
      buyerMessage: TENANT_SUSPENDED_BUYER_MESSAGE,
      sellerMessage: TENANT_SUSPENDED_SELLER_MESSAGE,
    };
  }
  return { kind: "unavailable", buyerMessage: "Shop not found." };
}

/** Buyers may place new orders only when the shop is active. */
export function isTenantAcceptingOrders(status: TenantLifecycleStatus | null | undefined): boolean {
  return status === "active";
}

/**
 * Seller console write actions (products, settings, book delivery, etc.).
 * Suspended shops are hard-blocked — read-only settle of existing orders
 * remains on the buyer storefront (payment proof / order tracking).
 */
export function isTenantSellerWritable(status: TenantLifecycleStatus | null | undefined): boolean {
  return status === "active" || status === "pending";
}

/** Checkout API mapping — suspended must be 403, never a silent 200/404. */
export function checkoutHttpRejectionForStatus(
  status: TenantLifecycleStatus | null | undefined
): { httpStatus: 403; code: "TENANT_SUSPENDED"; error: string } | null {
  const access = classifyTenantPublicAccess(status);
  if (access.kind !== "suspended") return null;
  return {
    httpStatus: 403,
    code: "TENANT_SUSPENDED",
    error: access.buyerMessage,
  };
}

/** Seller API mapping for requireTenantSession hard-block. */
export function sellerWriteHttpRejectionForStatus(
  status: TenantLifecycleStatus | null | undefined
): { httpStatus: 403; code: "TENANT_SUSPENDED"; error: string } | null {
  if (isTenantSellerWritable(status)) return null;
  return {
    httpStatus: 403,
    code: "TENANT_SUSPENDED",
    error: TENANT_SUSPENDED_SELLER_MESSAGE,
  };
}
