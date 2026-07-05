"use server";

import { revalidatePath } from "next/cache";
import {
  moderateContentItem,
  setTenantPlan,
  setTenantStatus,
  setUserRole,
  setUserStatus,
  writeAudit,
  type TenantStatus,
  type UserStatus,
} from "@guma-commerce/db";
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
