import { z } from "zod";

/** Naming: Domain.EventName.VVersion */
export const EVENT_NAMES = {
  TENANT_CREATED: "Tenant.Created.V1",
  STORE_PUBLISHED: "Store.Published.V1",
  THEME_CHANGE_APPROVED: "Theme.ChangeApproved.V1",
  THEME_PUBLISHED: "Theme.Published.V1",
  THEME_ROLLED_BACK: "Theme.RolledBack.V1",
  CATALOG_CHANGE_APPROVED: "Catalog.ChangeApproved.V1",
  PRICING_CHANGE_APPROVED: "Pricing.ChangeApproved.V1",
  SEO_UPDATED: "Seo.Updated.V1",
  SEO_CHANGE_APPROVED: "Seo.ChangeApproved.V1",
  SEO_PUBLISHED: "Seo.Published.V1",
  SEO_ROLLED_BACK: "Seo.RolledBack.V1",
  ORDER_PAYMENT_SUCCEEDED: "Order.PaymentSucceeded.V1",
  MERCHANT_UPGRADED: "Merchant.Upgraded.V1",
  AI_PLAN_COMPLETED: "AI.PlanCompleted.V1",
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

const baseMeta = z.object({
  tenantId: z.string().uuid().optional(),
  correlationId: z.string().optional(),
  causationId: z.string().optional(),
  idempotencyKey: z.string().min(1).optional(),
});

export const TenantCreatedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.TENANT_CREATED),
  data: z.object({
    tenantId: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    plan: z.string().default("free"),
  }),
});

export const StorePublishedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.STORE_PUBLISHED),
  data: z.object({
    tenantId: z.string().uuid(),
    slug: z.string(),
    templateId: z.string(),
    customizationVersion: z.number().int().positive(),
  }),
});

export const ThemeChangeApprovedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.THEME_CHANGE_APPROVED),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
    scope: z.string(),
  }),
});

export const ThemePublishedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.THEME_PUBLISHED),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
    customizationVersion: z.number().int().positive(),
    templateId: z.string().optional(),
  }),
});

export const ThemeRolledBackV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.THEME_ROLLED_BACK),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
  }),
});

export const CatalogChangeApprovedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.CATALOG_CHANGE_APPROVED),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
    productId: z.string().uuid().optional(),
  }),
});

export const PricingChangeApprovedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.PRICING_CHANGE_APPROVED),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
    productId: z.string().uuid(),
    basePrice: z.string().optional(),
  }),
});

export const SeoUpdatedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.SEO_UPDATED),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid().optional(),
    siteTitle: z.string().optional(),
  }),
});

export const SeoChangeApprovedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.SEO_CHANGE_APPROVED),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
    scope: z.string().optional(),
  }),
});

export const SeoPublishedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.SEO_PUBLISHED),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
    siteTitle: z.string().optional(),
  }),
});

export const SeoRolledBackV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.SEO_ROLLED_BACK),
  data: z.object({
    tenantId: z.string().uuid(),
    changeRequestId: z.string().uuid(),
  }),
});

export const OrderPaymentSucceededV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.ORDER_PAYMENT_SUCCEEDED),
  data: z.object({
    tenantId: z.string().uuid(),
    orderId: z.string().uuid().optional(),
    orderNumber: z.string(),
    total: z.string().optional(),
    gatewayIntentId: z.string().optional(),
  }),
});

export const MerchantUpgradedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.MERCHANT_UPGRADED),
  data: z.object({
    tenantId: z.string().uuid(),
    plan: z.string(),
    previousPlan: z.string().optional(),
  }),
});

export const AiPlanCompletedV1 = baseMeta.extend({
  name: z.literal(EVENT_NAMES.AI_PLAN_COMPLETED),
  data: z.object({
    tenantId: z.string().uuid(),
    taskType: z.string(),
    status: z.enum(["completed", "failed", "cancelled"]),
  }),
});

export const DomainEventSchema = z.discriminatedUnion("name", [
  TenantCreatedV1,
  StorePublishedV1,
  ThemeChangeApprovedV1,
  ThemePublishedV1,
  ThemeRolledBackV1,
  CatalogChangeApprovedV1,
  PricingChangeApprovedV1,
  SeoUpdatedV1,
  SeoChangeApprovedV1,
  SeoPublishedV1,
  SeoRolledBackV1,
  OrderPaymentSucceededV1,
  MerchantUpgradedV1,
  AiPlanCompletedV1,
]);

export type DomainEvent = z.infer<typeof DomainEventSchema>;

export type EmitPayload =
  | { name: typeof EVENT_NAMES.TENANT_CREATED; data: z.infer<typeof TenantCreatedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.STORE_PUBLISHED; data: z.infer<typeof StorePublishedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.THEME_CHANGE_APPROVED; data: z.infer<typeof ThemeChangeApprovedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.THEME_PUBLISHED; data: z.infer<typeof ThemePublishedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.THEME_ROLLED_BACK; data: z.infer<typeof ThemeRolledBackV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.CATALOG_CHANGE_APPROVED; data: z.infer<typeof CatalogChangeApprovedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.PRICING_CHANGE_APPROVED; data: z.infer<typeof PricingChangeApprovedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.SEO_UPDATED; data: z.infer<typeof SeoUpdatedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.SEO_CHANGE_APPROVED; data: z.infer<typeof SeoChangeApprovedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.SEO_PUBLISHED; data: z.infer<typeof SeoPublishedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.SEO_ROLLED_BACK; data: z.infer<typeof SeoRolledBackV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.ORDER_PAYMENT_SUCCEEDED; data: z.infer<typeof OrderPaymentSucceededV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.MERCHANT_UPGRADED; data: z.infer<typeof MerchantUpgradedV1>["data"]; idempotencyKey?: string; correlationId?: string }
  | { name: typeof EVENT_NAMES.AI_PLAN_COMPLETED; data: z.infer<typeof AiPlanCompletedV1>["data"]; idempotencyKey?: string; correlationId?: string };
