import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const localeEnum = pgEnum("locale", ["en", "fil", "taglish"]);
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "seller_owner",
  "seller_staff",
  "customer",
]);
export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]);
export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "paymongo",
  "xendit",
  "cod",
  "manual",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "paid",
  "failed",
  "refunded",
]);
export const deliveryProviderEnum = pgEnum("delivery_provider", [
  "lalamove",
  "grab",
  "manual",
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "sms",
  "email",
  "push",
]);

export const agentScheduleEnum = pgEnum("agent_schedule", ["daily", "weekly", "manual"]);
export const contentQueueStatusEnum = pgEnum("content_queue_status", [
  "draft",
  "approved",
  "scheduled",
  "posted",
  "skipped",
]);
export const contentPlatformEnum = pgEnum("content_platform", [
  "instagram",
  "tiktok",
  "facebook",
  "whatsapp",
]);
export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "running",
  "completed",
  "failed",
]);

// ─── Tenancy ─────────────────────────────────────────────────────────────────

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    legalName: varchar("legal_name", { length: 255 }),
    category: varchar("category", { length: 100 }),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    themeJson: jsonb("theme_json").$type<{
      templateId?: string;
      primaryColor?: string;
      accentColor?: string;
      fontFamily?: string;
      displayFont?: "bricolage" | "system" | "mono-accent";
      /** Curated palette applied at signup or from the shop builder. */
      paletteId?: string;
      /** Brand vibe chosen at signup. */
      vibe?: string;
      tagline?: string;
      promoTitle?: string;
      promoSubtitle?: string;
    }>(),
    localeDefault: localeEnum("locale_default").default("taglish"),
    currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("Asia/Manila").notNull(),
    pickupAddressId: uuid("pickup_address_id"),
    settingsJson: jsonb("settings_json").$type<{
      codEnabled?: boolean;
      autoAcceptOrders?: boolean;
      minOrderAmount?: number;
      delivery?: {
        provider?: "lalamove" | "grab" | "manual";
        flatRate?: number;
        freeDeliveryMin?: number;
        pickupEnabled?: boolean;
        deliveryNotes?: string;
        pickupAddress?: string;
      };
      notifications?: {
        emailOnNewOrder?: boolean;
        smsOnNewOrder?: boolean;
        emailOnOrderStatus?: boolean;
        marketingEmails?: boolean;
      };
      whatsapp?: {
        enabled?: boolean;
        phone?: string;
        greeting?: string;
        connectedAt?: string;
      };
      tracking?: {
        facebookPixelId?: string;
        googleAnalyticsId?: string;
        tiktokPixelId?: string;
      };
      shopAssistant?: {
        enabled?: boolean;
        name?: string;
        greeting?: string;
        tone?: "friendly_taglish" | "professional_en" | "gen_z_taglish";
      };
      agents?: {
        postingEnabled?: boolean;
        campaignEnabled?: boolean;
        postingSchedule?: "daily" | "weekly" | "manual";
        postingTime?: string;
        weeklyDay?: number;
        channels?: Array<"instagram" | "tiktok" | "facebook">;
        lastReminderDate?: string;
      };
    }>(),
    subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("free"),
    /** When a PayMongo-billed plan period ends; null for free/manual plans. */
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    /** Next per-tenant order sequence number, claimed atomically at checkout. */
    nextOrderSeq: integer("next_order_seq").default(1).notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("tenants_slug_idx").on(table.slug)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").default("customer").notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id),
    profileJson: jsonb("profile_json").$type<{
      displayName?: string;
      avatarUrl?: string;
      googleId?: string;
    }>(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    // Bumping this invalidates every JWT issued before the bump (logout-all).
    sessionVersion: integer("session_version").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_phone_idx").on(table.phone),
    index("users_tenant_idx").on(table.tenantId),
  ]
);

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  label: varchar("label", { length: 100 }),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  barangay: varchar("barangay", { length: 255 }),
  city: varchar("city", { length: 255 }).notNull(),
  province: varchar("province", { length: 255 }).notNull(),
  region: varchar("region", { length: 255 }),
  postalCode: varchar("postal_code", { length: 20 }),
  psgcCode: varchar("psgc_code", { length: 20 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Catalog ─────────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    parentId: uuid("parent_id"),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("categories_tenant_idx").on(table.tenantId)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    categoryId: uuid("category_id").references(() => categories.id),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    descriptionHtml: text("description_html"),
    status: productStatusEnum("status").default("draft").notNull(),
    basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 12, scale: 2 }),
    trackInventory: boolean("track_inventory").default(true),
    allowCustomization: boolean("allow_customization").default(false),
    metadataJson: jsonb("metadata_json").$type<{
      prepTimeMinutes?: number;
      allergens?: string[];
    }>(),
    aiGenerated: boolean("ai_generated").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("products_tenant_status_idx").on(table.tenantId, table.status),
    uniqueIndex("products_tenant_slug_idx").on(table.tenantId, table.slug),
  ]
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    sku: varchar("sku", { length: 100 }),
    title: varchar("title", { length: 255 }).notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    stockQty: integer("stock_qty").default(0),
    optionsJson: jsonb("options_json").$type<Record<string, string>>(),
    imageUrl: text("image_url"),
  },
  (table) => [index("product_variants_product_idx").on(table.productId)]
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    variantId: uuid("variant_id").references(() => productVariants.id),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 255 }),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [index("product_images_product_idx").on(table.productId)]
);

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    orderNumber: varchar("order_number", { length: 32 }).notNull(),
    customerId: uuid("customer_id").references(() => users.id),
    guestPhone: varchar("guest_phone", { length: 20 }),
    guestName: varchar("guest_name", { length: 255 }),
    guestEmail: varchar("guest_email", { length: 255 }),
    status: orderStatusEnum("status").default("pending_payment").notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
    deliveryFee: decimal("delivery_fee", { precision: 12, scale: 2 }).default("0"),
    serviceFee: decimal("service_fee", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("pending"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    deliveryType: varchar("delivery_type", { length: 20 }).default("delivery"),
    deliveryAddressJson: jsonb("delivery_address_json"),
    pickupAddressId: uuid("pickup_address_id").references(() => addresses.id),
    notes: text("notes"),
    sourceChannel: varchar("source_channel", { length: 50 }),
    utmJson: jsonb("utm_json"),
    metaCartOrigin: varchar("meta_cart_origin", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    // Order numbers are unique per tenant (tracking lookups are always scoped
    // by tenant slug), which lets every shop have its own 0001, 0002, ...
    uniqueIndex("orders_tenant_number_idx").on(table.tenantId, table.orderNumber),
    index("orders_tenant_status_idx").on(table.tenantId, table.status, table.createdAt),
    index("orders_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("orders_guest_phone_idx").on(table.guestPhone),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id").references(() => products.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    titleSnapshot: varchar("title_snapshot", { length: 255 }).notNull(),
    variantSnapshot: varchar("variant_snapshot", { length: 255 }),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
    customizationsJson: jsonb("customizations_json"),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
  ]
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    status: orderStatusEnum("status").notNull(),
    note: text("note"),
    actorId: uuid("actor_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("order_status_history_order_idx").on(table.orderId)]
);

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    gateway: paymentGatewayEnum("gateway").notNull(),
    gatewayIntentId: varchar("gateway_intent_id", { length: 255 }),
    gatewayPaymentId: varchar("gateway_payment_id", { length: 255 }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    methodType: varchar("method_type", { length: 50 }),
    rawWebhookJson: jsonb("raw_webhook_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("payment_intent_idx").on(table.gatewayIntentId),
    index("payment_order_idx").on(table.orderId),
  ]
);

// ─── Delivery ────────────────────────────────────────────────────────────────

export const deliveryQuotes = pgTable(
  "delivery_quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    provider: deliveryProviderEnum("provider").notNull(),
    quoteId: varchar("quote_id", { length: 255 }),
    fee: decimal("fee", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("PHP"),
    etaMinutes: integer("eta_minutes"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    rawResponseJson: jsonb("raw_response_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("delivery_quotes_order_idx").on(table.orderId)]
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    quoteId: uuid("quote_id").references(() => deliveryQuotes.id),
    provider: deliveryProviderEnum("provider").notNull(),
    providerOrderId: varchar("provider_order_id", { length: 255 }),
    status: varchar("status", { length: 50 }),
    driverName: varchar("driver_name", { length: 255 }),
    driverPhone: varchar("driver_phone", { length: 20 }),
    driverPlateNumber: varchar("driver_plate_number", { length: 20 }),
    /** Last known courier location pushed by the provider webhook. */
    driverLat: decimal("driver_lat", { precision: 10, scale: 7 }),
    driverLng: decimal("driver_lng", { precision: 10, scale: 7 }),
    driverLocationAt: timestamp("driver_location_at", { withTimezone: true }),
    trackingUrl: text("tracking_url"),
    bookedAt: timestamp("booked_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("deliveries_order_idx").on(table.orderId),
    index("deliveries_provider_order_idx").on(table.providerOrderId),
  ]
);

// ─── Billing & notifications ─────────────────────────────────────────────────

/** One row per PayMongo plan payment; unique intent id keeps the webhook idempotent. */
export const planPayments = pgTable(
  "plan_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    plan: varchar("plan", { length: 50 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
    gateway: paymentGatewayEnum("gateway").default("paymongo").notNull(),
    gatewayIntentId: varchar("gateway_intent_id", { length: 255 }),
    status: paymentStatusEnum("status").default("pending").notNull(),
    periodDays: integer("period_days").default(30).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("plan_payments_intent_idx").on(table.gatewayIntentId),
    index("plan_payments_tenant_idx").on(table.tenantId),
  ]
);

/** Web Push subscriptions for seller notifications (VAPID). */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint),
    index("push_subscriptions_tenant_idx").on(table.tenantId),
  ]
);

// ─── AI & Content ────────────────────────────────────────────────────────────

export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  userId: uuid("user_id").references(() => users.id),
  templateKey: varchar("template_key", { length: 100 }).notNull(),
  inputPrompt: text("input_prompt").notNull(),
  outputJson: jsonb("output_json"),
  model: varchar("model", { length: 100 }),
  tokensUsed: integer("tokens_used"),
  appliedToProductId: uuid("applied_to_product_id").references(() => products.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentQueue = pgTable(
  "content_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    agentKey: varchar("agent_key", { length: 50 }).notNull(),
    platform: contentPlatformEnum("platform").notNull(),
    title: varchar("title", { length: 255 }),
    body: text("body").notNull(),
    mediaBrief: text("media_brief"),
    status: contentQueueStatusEnum("status").default("draft").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    outputJson: jsonb("output_json"),
    flagged: boolean("flagged").default(false).notNull(),
    moderationNote: text("moderation_note"),
    moderatedBy: uuid("moderated_by").references(() => users.id),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("content_queue_tenant_idx").on(table.tenantId),
    index("content_queue_status_idx").on(table.status),
    index("content_queue_flagged_idx").on(table.flagged),
  ]
);

// ─── Platform administration ─────────────────────────────────────────────────

export const platformAuditLog = pgTable(
  "platform_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id),
    actorEmail: varchar("actor_email", { length: 255 }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: uuid("entity_id"),
    entityLabel: varchar("entity_label", { length: 255 }),
    metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("platform_audit_actor_idx").on(table.actorId),
    index("platform_audit_created_idx").on(table.createdAt),
    index("platform_audit_entity_idx").on(table.entityType, table.entityId),
  ]
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    agentKey: varchar("agent_key", { length: 50 }).notNull(),
    status: agentRunStatusEnum("status").default("running").notNull(),
    itemsCreated: integer("items_created").default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [index("agent_runs_tenant_idx").on(table.tenantId)]
);

export const shopChatMessages = pgTable(
  "shop_chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("shop_chat_tenant_session_idx").on(table.tenantId, table.sessionId),
    index("shop_chat_tenant_created_idx").on(table.tenantId, table.createdAt),
  ]
);

export const aiUsageMonthly = pgTable(
  "ai_usage_monthly",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    periodMonth: varchar("period_month", { length: 7 }).notNull(),
    generations: integer("generations").default(0).notNull(),
    tokensUsed: integer("tokens_used").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ai_usage_tenant_month_idx").on(table.tenantId, table.periodMonth),
  ]
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  products: many(products),
  orders: many(orders),
  users: many(users),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  items: many(orderItems),
  payments: many(paymentTransactions),
  delivery: one(deliveries),
}));
