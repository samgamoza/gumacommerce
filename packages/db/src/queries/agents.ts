import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../client";
import { agentRuns, contentQueue, shopChatMessages, tenants } from "../schema/index";

export type ContentQueueItem = {
  id: string;
  agentKey: string;
  platform: "instagram" | "tiktok" | "facebook" | "whatsapp";
  title: string | null;
  body: string;
  mediaBrief: string | null;
  status: "draft" | "approved" | "scheduled" | "posted" | "skipped";
  scheduledFor: Date | null;
  postedAt: Date | null;
  outputJson: unknown;
  createdAt: Date;
};

export type AgentSettings = {
  postingEnabled: boolean;
  campaignEnabled: boolean;
  postingSchedule: "daily" | "weekly" | "manual";
  postingTime: string;
  weeklyDay: number;
  channels: Array<"instagram" | "tiktok" | "facebook">;
};

export type ShopAssistantSettings = {
  enabled: boolean;
  name: string;
  greeting: string;
  tone: "friendly_taglish" | "professional_en" | "gen_z_taglish";
  /** Buyer↔seller inbox on the same chat widget (MVP/beta). */
  humanInbox: boolean;
};

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  postingEnabled: true,
  campaignEnabled: true,
  postingSchedule: "daily",
  postingTime: "18:00",
  weeklyDay: 1,
  channels: ["instagram", "tiktok"],
};

export const DEFAULT_SHOP_ASSISTANT: ShopAssistantSettings = {
  enabled: true,
  name: "Shop chat",
  greeting:
    "Hi! Ask about products, delivery, or payment. You can also message the seller directly here.",
  tone: "friendly_taglish",
  humanInbox: true,
};

export function resolveAgentSettings(
  settingsJson: Record<string, unknown> | null | undefined
): AgentSettings {
  const agents = settingsJson?.agents as Partial<AgentSettings> | undefined;
  return {
    ...DEFAULT_AGENT_SETTINGS,
    ...agents,
    channels: agents?.channels ?? DEFAULT_AGENT_SETTINGS.channels,
  };
}

export function resolveShopAssistantSettings(
  settingsJson: Record<string, unknown> | null | undefined
): ShopAssistantSettings {
  const assistant = settingsJson?.shopAssistant as Partial<ShopAssistantSettings> | undefined;
  return {
    ...DEFAULT_SHOP_ASSISTANT,
    ...assistant,
    humanInbox: assistant?.humanInbox !== false,
  };
}

export async function listContentQueue(
  tenantId: string,
  statuses?: ContentQueueItem["status"][]
): Promise<ContentQueueItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(contentQueue)
    .where(
      statuses?.length
        ? and(eq(contentQueue.tenantId, tenantId), inArray(contentQueue.status, statuses))
        : eq(contentQueue.tenantId, tenantId)
    )
    .orderBy(desc(contentQueue.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    agentKey: row.agentKey,
    platform: row.platform,
    title: row.title,
    body: row.body,
    mediaBrief: row.mediaBrief,
    status: row.status,
    scheduledFor: row.scheduledFor,
    postedAt: row.postedAt,
    outputJson: row.outputJson,
    createdAt: row.createdAt,
  }));
}

export async function createContentQueueItem(input: {
  tenantId: string;
  agentKey: string;
  platform: ContentQueueItem["platform"];
  title?: string;
  body: string;
  mediaBrief?: string;
  outputJson?: unknown;
  scheduledFor?: Date;
}): Promise<ContentQueueItem> {
  const db = getDb();
  const [row] = await db
    .insert(contentQueue)
    .values({
      tenantId: input.tenantId,
      agentKey: input.agentKey,
      platform: input.platform,
      title: input.title ?? null,
      body: input.body,
      mediaBrief: input.mediaBrief ?? null,
      outputJson: input.outputJson ?? null,
      scheduledFor: input.scheduledFor ?? null,
      status: "draft",
    })
    .returning();

  return {
    id: row.id,
    agentKey: row.agentKey,
    platform: row.platform,
    title: row.title,
    body: row.body,
    mediaBrief: row.mediaBrief,
    status: row.status,
    scheduledFor: row.scheduledFor,
    postedAt: row.postedAt,
    outputJson: row.outputJson,
    createdAt: row.createdAt,
  };
}

export async function updateContentQueueStatus(
  tenantId: string,
  itemId: string,
  status: ContentQueueItem["status"]
): Promise<ContentQueueItem | null> {
  const db = getDb();
  const [row] = await db
    .update(contentQueue)
    .set({
      status,
      ...(status === "posted" ? { postedAt: new Date() } : {}),
    })
    .where(and(eq(contentQueue.id, itemId), eq(contentQueue.tenantId, tenantId)))
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    agentKey: row.agentKey,
    platform: row.platform,
    title: row.title,
    body: row.body,
    mediaBrief: row.mediaBrief,
    status: row.status,
    scheduledFor: row.scheduledFor,
    postedAt: row.postedAt,
    outputJson: row.outputJson,
    createdAt: row.createdAt,
  };
}

export async function startAgentRun(tenantId: string, agentKey: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(agentRuns)
    .values({ tenantId, agentKey, status: "running" })
    .returning({ id: agentRuns.id });
  return row.id;
}

export async function finishAgentRun(
  runId: string,
  result: { itemsCreated: number; errorMessage?: string }
): Promise<void> {
  const db = getDb();
  await db
    .update(agentRuns)
    .set({
      status: result.errorMessage ? "failed" : "completed",
      itemsCreated: result.itemsCreated,
      errorMessage: result.errorMessage ?? null,
      finishedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId));
}

export async function listRecentAgentRuns(tenantId: string, limit = 10) {
  const db = getDb();
  return db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.tenantId, tenantId))
    .orderBy(desc(agentRuns.startedAt))
    .limit(limit);
}

export async function listActiveTenantsForAgents(): Promise<
  Array<{
    id: string;
    slug: string;
    name: string;
    category: string | null;
    themeJson: unknown;
    settingsJson: unknown;
    subscriptionPlan: string | null;
  }>
> {
  const db = getDb();
  return db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      category: tenants.category,
      themeJson: tenants.themeJson,
      settingsJson: tenants.settingsJson,
      subscriptionPlan: tenants.subscriptionPlan,
    })
    .from(tenants)
    .where(eq(tenants.status, "active"));
}

export async function saveShopChatMessage(input: {
  tenantId: string;
  sessionId: string;
  role: "user" | "assistant" | "buyer" | "seller";
  content: string;
}): Promise<{ id: string; createdAt: Date }> {
  const db = getDb();
  const [row] = await db
    .insert(shopChatMessages)
    .values({
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
    })
    .returning({ id: shopChatMessages.id, createdAt: shopChatMessages.createdAt });
  return row!;
}

export async function listShopChatMessages(input: {
  tenantId: string;
  sessionId: string;
  limit?: number;
}): Promise<Array<{ id: string; role: string; content: string; createdAt: Date }>> {
  const db = getDb();
  return db
    .select({
      id: shopChatMessages.id,
      role: shopChatMessages.role,
      content: shopChatMessages.content,
      createdAt: shopChatMessages.createdAt,
    })
    .from(shopChatMessages)
    .where(
      and(
        eq(shopChatMessages.tenantId, input.tenantId),
        eq(shopChatMessages.sessionId, input.sessionId)
      )
    )
    .orderBy(shopChatMessages.createdAt)
    .limit(input.limit ?? 120);
}

export async function listShopChatSessions(
  tenantId: string,
  limit = 40
): Promise<
  Array<{
    sessionId: string;
    lastMessage: string;
    lastRole: string;
    lastAt: Date;
    messageCount: number;
  }>
> {
  const db = getDb();
  const rows = await db
    .select({
      sessionId: shopChatMessages.sessionId,
      content: shopChatMessages.content,
      role: shopChatMessages.role,
      createdAt: shopChatMessages.createdAt,
    })
    .from(shopChatMessages)
    .where(eq(shopChatMessages.tenantId, tenantId))
    .orderBy(desc(shopChatMessages.createdAt))
    .limit(500);

  const bySession = new Map<
    string,
    { sessionId: string; lastMessage: string; lastRole: string; lastAt: Date; messageCount: number }
  >();

  for (const row of rows) {
    const existing = bySession.get(row.sessionId);
    if (!existing) {
      bySession.set(row.sessionId, {
        sessionId: row.sessionId,
        lastMessage: row.content,
        lastRole: row.role,
        lastAt: row.createdAt,
        messageCount: 1,
      });
    } else {
      existing.messageCount += 1;
    }
  }

  return Array.from(bySession.values())
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
    .slice(0, limit);
}

export async function getTenantIdBySlug(slug: string): Promise<string | null> {
  const db = getDb();
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return tenant?.id ?? null;
}
