import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../client";
import { changeRequests, platformAuditLog, tenants } from "../schema/index";
import { publishThemeDraft, getLaunchTenantState, type ThemeJson } from "./launch";
import { createProductForTenant, updateProductForTenant } from "./products";
import { publishTenantSeo, type TenantSeoJson } from "./seo";
import type { TenantCheckoutJson } from "./checkout";
import type { TenantShippingJson } from "./shipping";

export type ChangeRequestDomain =
  | "theme"
  | "pricing"
  | "catalog"
  | "seo"
  | "checkout"
  | "shipping";

export type ChangeRequestStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "published"
  | "rolled_back";

export type ActorType = "user" | "ai" | "system";

export interface ChangeRequestRow {
  id: string;
  tenantId: string;
  domain: ChangeRequestDomain;
  status: ChangeRequestStatus;
  scope: string;
  approvalLevel: string;
  proposedByType: ActorType;
  proposedByUserId: string | null;
  aiGenerationId: string | null;
  summary: string | null;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

function mapRow(row: typeof changeRequests.$inferSelect): ChangeRequestRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    domain: row.domain,
    status: row.status,
    scope: row.scope,
    approvalLevel: row.approvalLevel,
    proposedByType: row.proposedByType,
    proposedByUserId: row.proposedByUserId,
    aiGenerationId: row.aiGenerationId,
    summary: row.summary,
    beforeJson: (row.beforeJson as Record<string, unknown> | null) ?? null,
    afterJson: (row.afterJson as Record<string, unknown> | null) ?? null,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    reviewNote: row.reviewNote,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
  };
}

export async function createChangeRequest(input: {
  tenantId: string;
  domain: ChangeRequestDomain;
  scope: string;
  approvalLevel: string;
  proposedByType: ActorType;
  proposedByUserId?: string | null;
  aiGenerationId?: string | null;
  summary?: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const [row] = await db
    .insert(changeRequests)
    .values({
      tenantId: input.tenantId,
      domain: input.domain,
      scope: input.scope,
      approvalLevel: input.approvalLevel,
      proposedByType: input.proposedByType,
      proposedByUserId: input.proposedByUserId ?? null,
      aiGenerationId: input.aiGenerationId ?? null,
      summary: input.summary ?? null,
      beforeJson: input.beforeJson ?? null,
      afterJson: input.afterJson ?? null,
      status: input.approvalLevel === "automatic" ? "approved" : "draft",
    })
    .returning();
  if (!row) throw new Error("Failed to create change request");
  return mapRow(row);
}

export async function submitChangeRequest(id: string, tenantId: string): Promise<ChangeRequestRow> {
  const db = getDb();
  const [row] = await db
    .update(changeRequests)
    .set({ status: "pending_review" })
    .where(
      and(
        eq(changeRequests.id, id),
        eq(changeRequests.tenantId, tenantId),
        inArray(changeRequests.status, ["draft", "pending_review"])
      )
    )
    .returning();
  if (!row) throw new Error("Change request not found or not submittable");
  return mapRow(row);
}

export async function approveChangeRequest(input: {
  id: string;
  tenantId: string;
  reviewedBy: string;
  reviewNote?: string;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const [row] = await db
    .update(changeRequests)
    .set({
      status: "approved",
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date(),
      reviewNote: input.reviewNote ?? null,
    })
    .where(
      and(
        eq(changeRequests.id, input.id),
        eq(changeRequests.tenantId, input.tenantId),
        inArray(changeRequests.status, ["draft", "pending_review", "approved"])
      )
    )
    .returning();
  if (!row) throw new Error("Change request not found or not approvable");
  return mapRow(row);
}

export async function rejectChangeRequest(input: {
  id: string;
  tenantId: string;
  reviewedBy: string;
  reviewNote?: string;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const [row] = await db
    .update(changeRequests)
    .set({
      status: "rejected",
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date(),
      reviewNote: input.reviewNote ?? null,
    })
    .where(
      and(
        eq(changeRequests.id, input.id),
        eq(changeRequests.tenantId, input.tenantId),
        inArray(changeRequests.status, ["draft", "pending_review"])
      )
    )
    .returning();
  if (!row) throw new Error("Change request not found or not rejectable");
  return mapRow(row);
}

export async function getChangeRequest(
  id: string,
  tenantId: string
): Promise<ChangeRequestRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(changeRequests)
    .where(and(eq(changeRequests.id, id), eq(changeRequests.tenantId, tenantId)))
    .limit(1);
  return row ? mapRow(row) : null;
}

export async function listChangeRequestsForTenant(
  tenantId: string,
  options?: { status?: ChangeRequestStatus[]; limit?: number }
): Promise<ChangeRequestRow[]> {
  const db = getDb();
  const limit = options?.limit ?? 50;
  const statuses = options?.status;

  const rows = statuses?.length
    ? await db
        .select()
        .from(changeRequests)
        .where(
          and(eq(changeRequests.tenantId, tenantId), inArray(changeRequests.status, statuses))
        )
        .orderBy(desc(changeRequests.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(changeRequests)
        .where(eq(changeRequests.tenantId, tenantId))
        .orderBy(desc(changeRequests.createdAt))
        .limit(limit);

  return rows.map(mapRow);
}

export async function writeTenantAudit(entry: {
  tenantId: string | null;
  actorType?: ActorType;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(platformAuditLog).values({
    tenantId: entry.tenantId,
    actorType: entry.actorType ?? "user",
    actorId: entry.actorId,
    actorEmail: entry.actorEmail,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    entityLabel: entry.entityLabel ?? null,
    metadataJson: entry.metadata ?? null,
  });
}

export async function listTenantAudit(
  tenantId: string,
  limit = 50
): Promise<
  Array<{
    id: string;
    action: string;
    entityType: string;
    entityLabel: string | null;
    actorEmail: string | null;
    actorType: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }>
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(platformAuditLog)
    .where(eq(platformAuditLog.tenantId, tenantId))
    .orderBy(desc(platformAuditLog.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    entityLabel: r.entityLabel,
    actorEmail: r.actorEmail,
    actorType: r.actorType,
    metadata: r.metadataJson ?? null,
    createdAt: r.createdAt,
  }));
}

/**
 * Publish an approved theme change request atomically.
 * Applies afterJson via publishThemeDraft path (draft already saved).
 */
export async function publishThemeChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<{ request: ChangeRequestRow; customizationVersion: number }> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "theme") throw new Error("Not a theme change request");
  if (request.status !== "approved" && request.status !== "draft" && request.status !== "pending_review") {
    throw new Error(`Cannot publish from status ${request.status}`);
  }
  if (request.approvalLevel === "admin_only") {
    throw new Error("This change requires platform admin approval");
  }

  // Ensure afterJson is on draft before publish
  if (request.afterJson) {
    await db
      .update(tenants)
      .set({
        themeDraftJson: request.afterJson as typeof tenants.$inferSelect.themeDraftJson,
        themeJson: request.afterJson as typeof tenants.$inferSelect.themeJson,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, input.tenantId));
  }

  const published = await publishThemeDraft(input.tenantId);
  if (!published) throw new Error("Publish failed");

  const [updated] = await db
    .update(changeRequests)
    .set({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: input.actorUserId,
      reviewedAt: new Date(),
    })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to mark change request published");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "theme.publish",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary ?? "Theme publish",
    metadata: {
      scope: request.scope,
      customizationVersion: published.customizationVersion,
      templateId: (request.afterJson as ThemeJson | null)?.templateId,
    },
  });

  return { request: mapRow(updated), customizationVersion: published.customizationVersion };
}

export interface CatalogListingProposal {
  title: string;
  slug?: string;
  descriptionHtml?: string;
  shortDescription?: string;
  basePrice: number | string;
  compareAtPrice?: number | string | null;
  stockQty?: number;
  status?: "draft" | "active";
  tags?: string[];
  photoShotList?: string[];
  imageUrl?: string;
  aiGenerated?: boolean;
}

/**
 * Publish a catalog change request by creating the proposed product.
 */
export async function publishCatalogChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<{ request: ChangeRequestRow; productId: string }> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "catalog") throw new Error("Not a catalog change request");
  if (!["approved", "draft", "pending_review"].includes(request.status)) {
    throw new Error(`Cannot publish from status ${request.status}`);
  }
  if (request.approvalLevel === "admin_only") {
    throw new Error("This change requires platform admin approval");
  }
  if (!request.afterJson) throw new Error("No catalog proposal to publish");

  const listing = request.afterJson as unknown as CatalogListingProposal;
  if (!listing.title?.trim()) throw new Error("Proposal missing product title");

  const basePrice =
    typeof listing.basePrice === "number"
      ? listing.basePrice.toFixed(2)
      : String(listing.basePrice);
  const compareAt =
    listing.compareAtPrice === null || listing.compareAtPrice === undefined
      ? undefined
      : typeof listing.compareAtPrice === "number"
        ? listing.compareAtPrice.toFixed(2)
        : String(listing.compareAtPrice);

  const product = await createProductForTenant(input.tenantId, {
    title: listing.title,
    slug: listing.slug ?? listing.title,
    descriptionHtml: listing.descriptionHtml,
    basePrice,
    compareAtPrice: compareAt,
    status: listing.status ?? "active",
    stockQty: listing.stockQty ?? 10,
    aiGenerated: listing.aiGenerated ?? true,
    imageUrl: listing.imageUrl,
  });

  const [updated] = await db
    .update(changeRequests)
    .set({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: input.actorUserId,
      reviewedAt: new Date(),
      afterJson: { ...request.afterJson, productId: product.id },
    })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to mark catalog change published");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "catalog.publish",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary ?? listing.title,
    metadata: { productId: product.id, scope: request.scope },
  });

  return { request: mapRow(updated), productId: product.id };
}

export interface PricingProposal {
  productId: string;
  title?: string;
  basePrice: number | string;
  compareAtPrice?: number | string | null;
  rationale?: string;
}

/**
 * Publish a pricing change request by applying the proposed prices to the product.
 */
export async function publishPricingChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<{ request: ChangeRequestRow; productId: string }> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "pricing") throw new Error("Not a pricing change request");
  if (!["approved", "draft", "pending_review"].includes(request.status)) {
    throw new Error(`Cannot publish from status ${request.status}`);
  }
  if (request.approvalLevel === "admin_only") {
    throw new Error("This change requires platform admin approval");
  }
  if (!request.afterJson) throw new Error("No pricing proposal to publish");

  const proposal = request.afterJson as unknown as PricingProposal;
  if (!proposal.productId) throw new Error("Proposal missing productId");

  const basePrice =
    typeof proposal.basePrice === "number"
      ? proposal.basePrice.toFixed(2)
      : String(proposal.basePrice);
  const compareAt =
    proposal.compareAtPrice === null || proposal.compareAtPrice === undefined
      ? null
      : typeof proposal.compareAtPrice === "number"
        ? proposal.compareAtPrice.toFixed(2)
        : String(proposal.compareAtPrice);

  const ok = await updateProductForTenant(input.tenantId, proposal.productId, {
    basePrice,
    compareAtPrice: compareAt,
  });
  if (!ok) throw new Error("Product not found");

  const [updated] = await db
    .update(changeRequests)
    .set({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: input.actorUserId,
      reviewedAt: new Date(),
    })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to mark pricing change published");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "pricing.publish",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary ?? proposal.title ?? "Price change",
    metadata: {
      productId: proposal.productId,
      basePrice,
      compareAtPrice: compareAt,
      scope: request.scope,
    },
  });

  return { request: mapRow(updated), productId: proposal.productId };
}

/**
 * Publish an SEO change request by writing afterJson to seo_published_json.
 */
export async function publishSeoChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<{ request: ChangeRequestRow; seo: TenantSeoJson }> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "seo") throw new Error("Not an SEO change request");
  if (!["approved", "draft", "pending_review"].includes(request.status)) {
    throw new Error(`Cannot publish from status ${request.status}`);
  }
  if (request.approvalLevel === "admin_only") {
    throw new Error("This change requires platform admin approval");
  }
  if (!request.afterJson) throw new Error("No SEO proposal to publish");

  const seo = await publishTenantSeo(input.tenantId, request.afterJson as TenantSeoJson);

  const [updated] = await db
    .update(changeRequests)
    .set({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: input.actorUserId,
      reviewedAt: new Date(),
      afterJson: seo as unknown as Record<string, unknown>,
    })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to mark SEO change published");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "seo.publish",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary ?? seo.siteTitle ?? "SEO publish",
    metadata: { scope: request.scope, siteTitle: seo.siteTitle },
  });

  return { request: mapRow(updated), seo };
}

/**
 * Rollback SEO to beforeJson snapshot (previous published state).
 */
export async function rollbackSeoChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "seo") throw new Error("Not an SEO change request");
  if (request.status !== "published") {
    throw new Error("Only published SEO changes can be rolled back");
  }

  const before = (request.beforeJson ?? {}) as TenantSeoJson;
  await publishTenantSeo(input.tenantId, before);

  const [updated] = await db
    .update(changeRequests)
    .set({ status: "rolled_back" })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to roll back SEO change");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "seo.rollback",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary,
    metadata: { scope: request.scope },
  });

  return mapRow(updated);
}

/**
 * Publish a checkout change request by writing afterJson to checkout_published_json.
 */
export async function publishCheckoutChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<{ request: ChangeRequestRow; checkout: TenantCheckoutJson }> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "checkout") throw new Error("Not a checkout change request");
  if (!["approved", "draft", "pending_review"].includes(request.status)) {
    throw new Error(`Cannot publish from status ${request.status}`);
  }
  if (request.approvalLevel === "admin_only") {
    throw new Error("This change requires platform admin approval");
  }
  if (!request.afterJson) throw new Error("No checkout proposal to publish");

  const { publishTenantCheckout } = await import("./checkout");
  const checkout = await publishTenantCheckout(
    input.tenantId,
    request.afterJson as TenantCheckoutJson
  );

  const [updated] = await db
    .update(changeRequests)
    .set({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: input.actorUserId,
      reviewedAt: new Date(),
      afterJson: checkout as unknown as Record<string, unknown>,
    })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to mark checkout change published");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "checkout.publish",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary ?? "Checkout publish",
    metadata: {
      scope: request.scope,
      codEnabled: checkout.codEnabled,
      minOrderAmount: checkout.minOrderAmount,
    },
  });

  return { request: mapRow(updated), checkout };
}

/**
 * Rollback checkout to beforeJson snapshot (previous published state).
 */
export async function rollbackCheckoutChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "checkout") throw new Error("Not a checkout change request");
  if (request.status !== "published") {
    throw new Error("Only published checkout changes can be rolled back");
  }

  const { publishTenantCheckout } = await import("./checkout");
  const before = (request.beforeJson ?? {}) as TenantCheckoutJson;
  await publishTenantCheckout(input.tenantId, before);

  const [updated] = await db
    .update(changeRequests)
    .set({ status: "rolled_back" })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to roll back checkout change");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "checkout.rollback",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary,
    metadata: { scope: request.scope },
  });

  return mapRow(updated);
}

/**
 * Publish a shipping change request by writing afterJson to shipping_published_json.
 */
export async function publishShippingChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<{ request: ChangeRequestRow; shipping: TenantShippingJson }> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "shipping") throw new Error("Not a shipping change request");
  if (!["approved", "draft", "pending_review"].includes(request.status)) {
    throw new Error(`Cannot publish from status ${request.status}`);
  }
  if (request.approvalLevel === "admin_only") {
    throw new Error("This change requires platform admin approval");
  }
  if (!request.afterJson) throw new Error("No shipping proposal to publish");

  const { publishTenantShipping } = await import("./shipping");
  const shipping = await publishTenantShipping(
    input.tenantId,
    request.afterJson as unknown as TenantShippingJson
  );

  const [updated] = await db
    .update(changeRequests)
    .set({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: input.actorUserId,
      reviewedAt: new Date(),
      afterJson: shipping as unknown as Record<string, unknown>,
    })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to mark shipping change published");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "shipping.publish",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary ?? "Shipping publish",
    metadata: {
      scope: request.scope,
      defaultProfileId: shipping.defaultProfileId,
      profileCount: shipping.profiles.length,
    },
  });

  return { request: mapRow(updated), shipping };
}

/**
 * Rollback shipping to beforeJson snapshot (previous published state).
 */
export async function rollbackShippingChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.domain !== "shipping") throw new Error("Not a shipping change request");
  if (request.status !== "published") {
    throw new Error("Only published shipping changes can be rolled back");
  }

  const { publishTenantShipping } = await import("./shipping");
  const before = (request.beforeJson ?? {}) as unknown as TenantShippingJson;
  await publishTenantShipping(input.tenantId, before);

  const [updated] = await db
    .update(changeRequests)
    .set({ status: "rolled_back" })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to roll back shipping change");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "shipping.rollback",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary,
    metadata: { scope: request.scope },
  });

  return mapRow(updated);
}

/** Mark an already-applied catalog create as published (Products save path). */
export async function markChangeRequestPublished(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
  productId?: string;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const existing = await getChangeRequest(input.id, input.tenantId);
  if (!existing) throw new Error("Change request not found");

  const [updated] = await db
    .update(changeRequests)
    .set({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: input.actorUserId,
      reviewedAt: new Date(),
      afterJson: input.productId
        ? { ...(existing.afterJson ?? {}), productId: input.productId }
        : existing.afterJson,
    })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Failed to mark change request published");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: `${existing.domain}.publish`,
    entityType: "change_request",
    entityId: input.id,
    entityLabel: existing.summary,
    metadata: { productId: input.productId, scope: existing.scope },
  });

  return mapRow(updated);
}

/**
 * Launch / merchant publish: create → approve → publish in one merchant gesture.
 */
export async function publishStorefrontWithApproval(input: {
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
  approvalLevel: string;
  scope?: string;
}): Promise<{
  request: ChangeRequestRow;
  customizationVersion: number;
  templateId: string;
  slug: string;
}> {
  const state = await getLaunchTenantState(input.tenantId);
  if (!state) throw new Error("Shop not found");

  const before = (state.themePublishedJson ?? state.themeJson ?? null) as Record<
    string,
    unknown
  > | null;
  const after = (state.themeDraftJson ?? state.themeJson ?? null) as Record<string, unknown> | null;
  if (!(after as ThemeJson | null)?.templateId) {
    throw new Error("Nothing to publish — choose a template and personalize first.");
  }

  const created = await createChangeRequest({
    tenantId: input.tenantId,
    domain: "theme",
    scope: input.scope ?? "ai.publish.store",
    approvalLevel: input.approvalLevel,
    proposedByType: "user",
    proposedByUserId: input.actorUserId,
    summary: `Publish storefront theme ${(after as ThemeJson).templateId}`,
    beforeJson: before,
    afterJson: after,
  });

  if (input.approvalLevel === "admin_only") {
    await submitChangeRequest(created.id, input.tenantId);
    throw new Error("This publish requires platform admin approval");
  }

  await approveChangeRequest({
    id: created.id,
    tenantId: input.tenantId,
    reviewedBy: input.actorUserId,
    reviewNote: "Merchant approved via GUMA Launch publish",
  });

  const { request, customizationVersion } = await publishThemeChangeRequest({
    id: created.id,
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail,
  });

  return {
    request,
    customizationVersion,
    templateId: (after as ThemeJson).templateId!,
    slug: state.slug,
  };
}

export async function rollbackThemeChangeRequest(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<ChangeRequestRow> {
  const db = getDb();
  const request = await getChangeRequest(input.id, input.tenantId);
  if (!request) throw new Error("Change request not found");
  if (request.status !== "published") throw new Error("Only published changes can roll back");
  if (!request.beforeJson) throw new Error("No before snapshot to restore");

  const before = request.beforeJson as ThemeJson;
  await db
    .update(tenants)
    .set({
      themePublishedJson: before as typeof tenants.$inferSelect.themePublishedJson,
      themeDraftJson: before as typeof tenants.$inferSelect.themeDraftJson,
      themeJson: before as typeof tenants.$inferSelect.themeJson,
      customizationVersion: sql`${tenants.customizationVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, input.tenantId));

  const [updated] = await db
    .update(changeRequests)
    .set({ status: "rolled_back", reviewNote: "Rolled back by merchant" })
    .where(and(eq(changeRequests.id, input.id), eq(changeRequests.tenantId, input.tenantId)))
    .returning();

  if (!updated) throw new Error("Rollback failed");

  await writeTenantAudit({
    tenantId: input.tenantId,
    actorType: "user",
    actorId: input.actorUserId,
    actorEmail: input.actorEmail,
    action: "theme.rollback",
    entityType: "change_request",
    entityId: input.id,
    entityLabel: request.summary,
    metadata: { restoredTemplateId: before.templateId },
  });

  return mapRow(updated);
}
