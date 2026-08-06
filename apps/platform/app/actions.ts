"use server";

import { revalidatePath } from "next/cache";
import {
  addSupportTicketMessage,
  getSupportTicketById,
  moderateContentItem,
  setActiveLanding,
  setTenantPlan,
  setTenantStatus,
  setUserRole,
  setUserStatus,
  updateSupportTicket,
  writeAudit,
  type ActiveLanding,
  type SupportTicketPriority,
  type SupportTicketStatus,
  type TenantStatus,
  type UserStatus,
} from "@guma-commerce/db";
import { notifyHelpdeskAgentReply } from "@guma-commerce/services";
import { requireSuperAdminApi } from "@/lib/api-auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

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
