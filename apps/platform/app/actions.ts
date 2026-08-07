"use server";

import { revalidatePath } from "next/cache";
import {
  addSupportTicketMessage,
  createTemplateStock,
  getSupportTicketById,
  listShopBusinessCategories,
  listTemplateStock,
  moderateContentItem,
  recordTemplateIntelligenceEvent,
  setActiveLanding,
  setShopCategoryStatus,
  setTemplateStockStatus,
  setTenantPlan,
  setTenantStatus,
  setUserRole,
  setUserStatus,
  slugifyShopCategory,
  updateSupportTicket,
  upsertShopBusinessCategory,
  writeAudit,
  type ActiveLanding,
  type ShopCategoryStatus,
  type SupportTicketPriority,
  type SupportTicketStatus,
  type TemplateStockSource,
  type TemplateStockStatus,
  type TenantStatus,
  type UserStatus,
} from "@guma-commerce/db";
import { notifyHelpdeskAgentReply } from "@guma-commerce/services";
import {
  defaultLiveTemplateForCategory,
  deriveStockSkin,
  isShopTemplateId,
  previewImageForCategory,
} from "@guma-commerce/storefront-themes";
import { requireSuperAdminApi } from "@/lib/api-auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

async function guard() {
  return requireSuperAdminApi();
}

function fail(error: unknown): ActionResult {
  const message = error instanceof Error ? error.message : "Action failed.";
  return { ok: false, error: message };
}

// ─── Tenants ─────────────────────────────────────────────────────────────────

export async function updateTenantStatusAction(
  tenantId: string,
  status: TenantStatus,
  label: string
): Promise<ActionResult> {
  try {
    const session = await guard();
    await setTenantStatus(tenantId, status);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: `tenant_${status}`,
      entityType: "tenant",
      entityId: tenantId,
      entityLabel: label,
    });
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${tenantId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateTenantPlanAction(
  tenantId: string,
  plan: string,
  label: string
): Promise<ActionResult> {
  try {
    const session = await guard();
    await setTenantPlan(tenantId, plan);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "tenant_plan_changed",
      entityType: "tenant",
      entityId: tenantId,
      entityLabel: label,
      metadata: { plan },
    });
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${tenantId}`);
    revalidatePath("/subscriptions");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function updateUserStatusAction(
  userId: string,
  status: UserStatus,
  label: string
): Promise<ActionResult> {
  try {
    const session = await guard();
    if (userId === session.userId) {
      return { ok: false, error: "You cannot change your own status." };
    }
    await setUserStatus(userId, status);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: `user_${status}`,
      entityType: "user",
      entityId: userId,
      entityLabel: label,
    });
    revalidatePath("/users");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: string,
  label: string
): Promise<ActionResult> {
  try {
    const session = await guard();
    if (userId === session.userId) {
      return { ok: false, error: "You cannot change your own role." };
    }
    await setUserRole(userId, role);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "user_role_changed",
      entityType: "user",
      entityId: userId,
      entityLabel: label,
      metadata: { role },
    });
    revalidatePath("/users");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Content moderation ──────────────────────────────────────────────────────

export async function moderateContentAction(
  itemId: string,
  input: { status?: "draft" | "approved" | "skipped"; flagged?: boolean; note?: string | null },
  label: string
): Promise<ActionResult> {
  try {
    const session = await guard();
    await moderateContentItem(itemId, { ...input, moderatorId: session.userId });
    const action = input.flagged
      ? "content_flagged"
      : input.status
        ? `content_${input.status}`
        : "content_moderated";
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action,
      entityType: "content",
      entityId: itemId,
      entityLabel: label,
      metadata: input as Record<string, unknown>,
    });
    revalidatePath("/moderation");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Frontends ───────────────────────────────────────────────────────────────

export async function setActiveLandingAction(value: ActiveLanding): Promise<ActionResult> {
  try {
    const session = await guard();
    await setActiveLanding(value);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "active_landing_changed",
      entityType: "platform_setting",
      entityLabel: value === "frontend2" ? "Guma One.ai" : "GumaCommerce",
      metadata: { key: "active_landing", value },
    });
    revalidatePath("/frontends");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Helpdesk ────────────────────────────────────────────────────────────────

export async function replySupportTicketAction(
  ticketId: string,
  body: string,
  isInternal = false
): Promise<ActionResult> {
  try {
    const session = await guard();
    const trimmed = body.trim();
    if (trimmed.length < 1) return { ok: false, error: "Message is empty." };
    await addSupportTicketMessage({
      ticketId,
      authorType: "agent",
      authorUserId: session.userId,
      authorName: session.displayName || session.email,
      body: trimmed,
      isInternal,
    });

    if (!isInternal) {
      const ticket = await getSupportTicketById(ticketId, { includeInternal: true });
      if (ticket?.requesterEmail) {
        const notify = await notifyHelpdeskAgentReply({
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          requesterEmail: ticket.requesterEmail,
          agentName: session.displayName || session.email,
          body: trimmed,
        });
        if (!notify.sent) {
          console.warn("[helpdesk] Agent reply email not delivered", {
            ticketNumber: ticket.ticketNumber,
            mock: notify.mock ?? false,
            error: notify.error,
          });
        }
      }
    }

    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: isInternal ? "support_internal_note" : "support_reply",
      entityType: "support_ticket",
      entityId: ticketId,
    });
    revalidatePath("/helpdesk");
    revalidatePath(`/helpdesk/${ticketId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateSupportTicketAction(
  ticketId: string,
  patch: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignToMe?: boolean;
  }
): Promise<ActionResult> {
  try {
    const session = await guard();
    await updateSupportTicket(ticketId, {
      status: patch.status,
      priority: patch.priority,
      assigneeId: patch.assignToMe ? session.userId : undefined,
    });
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "support_ticket_updated",
      entityType: "support_ticket",
      entityId: ticketId,
      metadata: patch as Record<string, unknown>,
    });
    revalidatePath("/helpdesk");
    revalidatePath(`/helpdesk/${ticketId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Template Intelligence ───────────────────────────────────────────────────

export async function upsertShopCategoryAction(input: {
  id?: string;
  label: string;
  parentId?: string | null;
  status?: ShopCategoryStatus;
  sortOrder?: number;
  minVariants?: number;
  targetVariants?: number;
  notes?: string | null;
}): Promise<ActionResult> {
  try {
    const session = await guard();
    const row = await upsertShopBusinessCategory(input);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: input.id ? "shop_category_updated" : "shop_category_created",
      entityType: "shop_business_category",
      entityId: row.id,
      entityLabel: row.label,
      metadata: { parentId: row.parentId ?? null },
    });
    await recordTemplateIntelligenceEvent({
      eventType: input.id ? "category_updated" : "category_created",
      categoryLabel: row.label,
      payload: {
        minVariants: row.minVariants,
        targetVariants: row.targetVariants,
        parentId: row.parentId ?? null,
      },
    });
    revalidatePath("/templates");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function setShopCategoryStatusAction(
  id: string,
  status: ShopCategoryStatus,
  label: string
): Promise<ActionResult> {
  try {
    const session = await guard();
    await setShopCategoryStatus(id, status);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: status === "enabled" ? "shop_category_enabled" : "shop_category_disabled",
      entityType: "shop_business_category",
      entityId: id,
      entityLabel: label,
    });
    revalidatePath("/templates");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function createTemplateStockAction(input: {
  label: string;
  categoryLabel: string;
  liveTemplateId: string;
  stockKey?: string;
  notes?: string | null;
  source?: TemplateStockSource;
  publish?: boolean;
}): Promise<ActionResult> {
  try {
    const session = await guard();
    if (!isShopTemplateId(input.liveTemplateId)) {
      return { ok: false, error: "Unknown live template id." };
    }
    const categories = await listShopBusinessCategories();
    const cat = categories.find((c) => c.label === input.categoryLabel);
    const baseKey =
      input.stockKey?.trim() ||
      `${slugifyShopCategory(input.categoryLabel)}-${slugifyShopCategory(input.label)}`;
    const stockKey = baseKey.slice(0, 80);
    const storeLook = deriveStockSkin(hashString(`stock::${stockKey}`));
    const row = await createTemplateStock({
      stockKey,
      label: input.label.trim(),
      categoryId: cat?.id ?? null,
      categoryLabel: input.categoryLabel,
      liveTemplateId: input.liveTemplateId,
      status: input.publish ? "published" : "draft",
      source: input.source ?? "ops_manual",
      notes: input.notes ?? null,
      previewImageUrl: previewImageForCategory(input.categoryLabel),
      storeLookJson: storeLook,
      createdByUserId: session.userId,
    });
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "template_stock_created",
      entityType: "template_stock",
      entityId: row.id,
      entityLabel: row.label,
      metadata: { stockKey: row.stockKey, status: row.status },
    });
    await recordTemplateIntelligenceEvent({
      eventType: "stock_created",
      categoryLabel: row.categoryLabel,
      stockKey: row.stockKey,
      payload: { source: row.source, liveTemplateId: row.liveTemplateId },
    });
    revalidatePath("/templates");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function setTemplateStockStatusAction(
  id: string,
  status: TemplateStockStatus,
  label: string
): Promise<ActionResult> {
  try {
    const session = await guard();
    const row = await setTemplateStockStatus(id, status);
    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: `template_stock_${status}`,
      entityType: "template_stock",
      entityId: id,
      entityLabel: label,
    });
    await recordTemplateIntelligenceEvent({
      eventType: `stock_${status}`,
      categoryLabel: row.categoryLabel,
      stockKey: row.stockKey,
    });
    revalidatePath("/templates");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

async function seedVariantsForCategory(input: {
  categoryId: string;
  actorUserId: string;
  count: number;
  source: TemplateStockSource;
  publish: boolean;
}): Promise<{ created: number; label: string; liveTemplateId: string }> {
  const categories = await listShopBusinessCategories();
  const cat = categories.find((c) => c.id === input.categoryId);
  if (!cat) throw new Error("Category not found.");

  const existing = await listTemplateStock({ categoryLabel: cat.label });
  const activeKeys = new Set(
    existing.filter((e) => e.status !== "archived").map((e) => e.stockKey)
  );
  const want = Math.max(1, Math.min(10, input.count));
  const liveTemplateId = defaultLiveTemplateForCategory(cat.label);
  const slug = cat.slug || slugifyShopCategory(cat.label);
  let created = 0;

  for (let i = 1; created < want && i <= want + 20; i += 1) {
    const stockKey = `${slug}-v${String(i).padStart(2, "0")}`;
    if (activeKeys.has(stockKey)) continue;
    const storeLook = deriveStockSkin(hashString(`stock::${stockKey}`));
    await createTemplateStock({
      stockKey,
      label: `${cat.label} Look ${i}`,
      categoryId: cat.id,
      categoryLabel: cat.label,
      liveTemplateId,
      status: input.publish ? "published" : "draft",
      source: input.source,
      notes: `Seeded toward ${cat.minVariants}–${cat.targetVariants} variants. Review before publish.`,
      previewImageUrl: previewImageForCategory(cat.label),
      storeLookJson: storeLook,
      createdByUserId: input.actorUserId,
    });
    activeKeys.add(stockKey);
    created += 1;
  }

  return { created, label: cat.label, liveTemplateId };
}

/**
 * Deterministic gap-filler: seed draft variants toward minVariants.
 * Uses nearest live renderer + unique storeLook — no LLM spend.
 * Later swap source to ai_curated when paid curation is wired.
 */
export async function seedCategoryVariantsAction(
  categoryId: string,
  options?: { count?: number; source?: TemplateStockSource; publish?: boolean }
): Promise<ActionResult & { count?: number }> {
  try {
    const session = await guard();
    const categories = await listShopBusinessCategories();
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return { ok: false, error: "Category not found." };

    const result = await seedVariantsForCategory({
      categoryId,
      actorUserId: session.userId,
      count: options?.count ?? cat.minVariants,
      source: options?.source ?? "ops_manual",
      publish: options?.publish ?? false,
    });

    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "template_stock_seeded",
      entityType: "shop_business_category",
      entityId: categoryId,
      entityLabel: result.label,
      metadata: { created: result.created, liveTemplateId: result.liveTemplateId },
    });
    await recordTemplateIntelligenceEvent({
      eventType: "stock_seeded",
      categoryLabel: result.label,
      payload: {
        created: result.created,
        liveTemplateId: result.liveTemplateId,
        source: options?.source ?? "ops_manual",
      },
    });
    revalidatePath("/templates");
    return { ok: true, count: result.created };
  } catch (error) {
    return fail(error);
  }
}

/** Seed drafts for every enabled category still under minVariants (bundle + stock). */
export async function fillCoverageGapsAction(bundleCounts: Record<string, number>): Promise<
  ActionResult & { categoriesTouched?: number; variantsCreated?: number }
> {
  try {
    const session = await guard();
    const categories = await listShopBusinessCategories({ enabledOnly: true });
    const stockCounts = new Map<string, number>();
    for (const row of await listTemplateStock({ statuses: ["published", "draft", "approved"] })) {
      stockCounts.set(row.categoryLabel, (stockCounts.get(row.categoryLabel) ?? 0) + 1);
    }

    let categoriesTouched = 0;
    let variantsCreated = 0;

    for (const cat of categories) {
      const total = (bundleCounts[cat.label] ?? 0) + (stockCounts.get(cat.label) ?? 0);
      const gap = Math.max(0, cat.minVariants - total);
      if (gap <= 0) continue;
      const result = await seedVariantsForCategory({
        categoryId: cat.id,
        actorUserId: session.userId,
        count: gap,
        source: "ops_manual",
        publish: false,
      });
      if (result.created > 0) {
        categoriesTouched += 1;
        variantsCreated += result.created;
      }
    }

    await writeAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "template_coverage_fill",
      entityType: "template_intelligence",
      metadata: { categoriesTouched, variantsCreated },
    });
    await recordTemplateIntelligenceEvent({
      eventType: "coverage_fill",
      payload: { categoriesTouched, variantsCreated },
    });
    revalidatePath("/templates");
    return { ok: true, categoriesTouched, variantsCreated };
  } catch (error) {
    return fail(error);
  }
}
