import { eq, inArray } from "drizzle-orm";
import { getDb } from "../client";
import { pushSubscriptions } from "../schema/index";

export interface SavePushSubscriptionInput {
  tenantId: string;
  userId?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

export async function savePushSubscription(input: SavePushSubscriptionInput): Promise<void> {
  const db = getDb();
  await db
    .insert(pushSubscriptions)
    .values({
      tenantId: input.tenantId,
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent?.slice(0, 255),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        tenantId: input.tenantId,
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
      },
    });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = getDb();
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function deletePushSubscriptions(endpoints: string[]): Promise<void> {
  if (endpoints.length === 0) return;
  const db = getDb();
  await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, endpoints));
}

export interface TenantPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function listPushSubscriptionsForTenant(
  tenantId: string
): Promise<TenantPushSubscription[]> {
  const db = getDb();
  const rows = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.tenantId, tenantId));
  return rows;
}
