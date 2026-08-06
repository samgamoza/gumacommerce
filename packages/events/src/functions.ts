import { inngest } from "./client";
import { EVENT_NAMES } from "./schemas";

/**
 * Inngest functions — side-effect consumers.
 * Keep request path fast; heavy work belongs here.
 *
 * TRACKED STUBS (do not silently leave as log-only forever):
 * - INNGEST-001 Store.Published.V1 → revalidatePath / CDN purge / merchant notify
 * - INNGEST-002 Order.PaymentSucceeded.V1 → inventory adjust, shipment quote, analytics fan-out
 * - INNGEST-003 Theme.Published.V1 / Theme.ChangeApproved.V1 → cache bust + audit fan-out
 * - INNGEST-004 Merchant.Upgraded.V1 / Tenant.Created.V1 → welcome email / plan entitlement sync
 * Soft launch may keep these as acknowledge-only; fill before relying on event-driven ops.
 */
export const onStorePublished = inngest.createFunction(
  { id: "store-published", retries: 3 },
  { event: EVENT_NAMES.STORE_PUBLISHED },
  async ({ event, step }) => {
    await step.run("log-publish", async () => {
      console.info("[inngest] Store.Published.V1", event.data);
      return { acknowledged: true, stub: "INNGEST-001" };
    });
  }
);

export const onOrderPaymentSucceeded = inngest.createFunction(
  { id: "order-payment-succeeded", retries: 3 },
  { event: EVENT_NAMES.ORDER_PAYMENT_SUCCEEDED },
  async ({ event, step }) => {
    await step.run("log-payment", async () => {
      console.info("[inngest] Order.PaymentSucceeded.V1", event.data);
      return { acknowledged: true, stub: "INNGEST-002" };
    });
  }
);

export const onMerchantUpgraded = inngest.createFunction(
  { id: "merchant-upgraded", retries: 2 },
  { event: EVENT_NAMES.MERCHANT_UPGRADED },
  async ({ event, step }) => {
    await step.run("log-upgrade", async () => {
      console.info("[inngest] Merchant.Upgraded.V1", event.data);
      return { acknowledged: true, stub: "INNGEST-004" };
    });
  }
);

export const onTenantCreated = inngest.createFunction(
  { id: "tenant-created", retries: 2 },
  { event: EVENT_NAMES.TENANT_CREATED },
  async ({ event, step }) => {
    await step.run("log-tenant", async () => {
      console.info("[inngest] Tenant.Created.V1", event.data);
      return { acknowledged: true, stub: "INNGEST-004" };
    });
  }
);

export const onThemePublished = inngest.createFunction(
  { id: "theme-published", retries: 2 },
  { event: EVENT_NAMES.THEME_PUBLISHED },
  async ({ event, step }) => {
    await step.run("log-theme-publish", async () => {
      console.info("[inngest] Theme.Published.V1", event.data);
      return { acknowledged: true, stub: "INNGEST-003" };
    });
  }
);

export const onThemeChangeApproved = inngest.createFunction(
  { id: "theme-change-approved", retries: 2 },
  { event: EVENT_NAMES.THEME_CHANGE_APPROVED },
  async ({ event, step }) => {
    await step.run("log-theme-approved", async () => {
      console.info("[inngest] Theme.ChangeApproved.V1", event.data);
      return { acknowledged: true, stub: "INNGEST-003" };
    });
  }
);

export const inngestFunctions = [
  onStorePublished,
  onThemePublished,
  onThemeChangeApproved,
  onOrderPaymentSucceeded,
  onMerchantUpgraded,
  onTenantCreated,
];
