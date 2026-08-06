import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "../client";
import {
  supportTicketMessages,
  supportTickets,
  tenants,
  users,
} from "../schema/index";

export type SupportTicketStatus =
  | "open"
  | "pending"
  | "in_progress"
  | "resolved"
  | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export type SupportTicketChannel =
  | "web_contact"
  | "seller_admin"
  | "buyer_order"
  | "internal";
export type SupportRequesterType = "anonymous" | "seller_user" | "buyer";

const FIRST_RESPONSE_SLA_HOURS = 4;
const RESOLVE_SLA_HOURS = 48;

function addHours(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

async function nextTicketNumber(): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportTickets);
  const n = (row?.count ?? 0) + 1;
  return `HD-${String(n).padStart(5, "0")}`;
}

export interface CreateSupportTicketInput {
  channel: SupportTicketChannel;
  requesterType: SupportRequesterType;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  userId?: string;
  tenantId?: string;
  orderId?: string;
  subject: string;
  category?: string;
  priority?: SupportTicketPriority;
  body: string;
}

export interface SupportTicketListItem {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  channel: SupportTicketChannel;
  requesterName: string | null;
  requesterEmail: string | null;
  tenantId: string | null;
  tenantName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  firstResponseAt: Date | null;
  slaFirstResponseDueAt: Date | null;
  slaResolveDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export async function createSupportTicket(
  input: CreateSupportTicketInput
): Promise<{ id: string; ticketNumber: string }> {
  const db = getDb();
  const now = new Date();
  const ticketNumber = await nextTicketNumber();

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      ticketNumber,
      channel: input.channel,
      requesterType: input.requesterType,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      requesterPhone: input.requesterPhone,
      userId: input.userId,
      tenantId: input.tenantId,
      orderId: input.orderId,
      subject: input.subject,
      category: input.category ?? "general",
      priority: input.priority ?? "normal",
      status: "open",
      slaFirstResponseDueAt: addHours(now, FIRST_RESPONSE_SLA_HOURS),
      slaResolveDueAt: addHours(now, RESOLVE_SLA_HOURS),
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: supportTickets.id, ticketNumber: supportTickets.ticketNumber });

  if (!ticket) throw new Error("Failed to create support ticket");

  await db.insert(supportTicketMessages).values({
    ticketId: ticket.id,
    authorType: "requester",
    authorUserId: input.userId,
    authorName: input.requesterName ?? "Requester",
    body: input.body,
    isInternal: false,
  });

  return ticket;
}

export async function listSupportTickets(filters: {
  status?: string;
  priority?: string;
  channel?: string;
  search?: string;
  tenantId?: string;
  limit?: number;
}): Promise<SupportTicketListItem[]> {
  const db = getDb();
  const conditions = [];
  if (filters.status) {
    conditions.push(eq(supportTickets.status, filters.status as SupportTicketStatus));
  }
  if (filters.priority) {
    conditions.push(eq(supportTickets.priority, filters.priority as SupportTicketPriority));
  }
  if (filters.channel) {
    conditions.push(eq(supportTickets.channel, filters.channel as SupportTicketChannel));
  }
  if (filters.tenantId) {
    conditions.push(eq(supportTickets.tenantId, filters.tenantId));
  }
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(supportTickets.subject, q),
        ilike(supportTickets.ticketNumber, q),
        ilike(supportTickets.requesterEmail, q),
        ilike(supportTickets.requesterName, q)
      )!
    );
  }

  const rows = await db
    .select({
      ticket: supportTickets,
      tenantName: tenants.name,
      assigneeEmail: users.email,
      assigneeProfile: users.profileJson,
    })
    .from(supportTickets)
    .leftJoin(tenants, eq(supportTickets.tenantId, tenants.id))
    .leftJoin(users, eq(supportTickets.assigneeId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(supportTickets.createdAt))
    .limit(filters.limit ?? 100);

  return rows.map((r) => ({
    id: r.ticket.id,
    ticketNumber: r.ticket.ticketNumber,
    subject: r.ticket.subject,
    category: r.ticket.category,
    status: r.ticket.status,
    priority: r.ticket.priority,
    channel: r.ticket.channel,
    requesterName: r.ticket.requesterName,
    requesterEmail: r.ticket.requesterEmail,
    tenantId: r.ticket.tenantId,
    tenantName: r.tenantName,
    assigneeId: r.ticket.assigneeId,
    assigneeName: r.assigneeProfile?.displayName ?? r.assigneeEmail ?? null,
    firstResponseAt: r.ticket.firstResponseAt,
    slaFirstResponseDueAt: r.ticket.slaFirstResponseDueAt,
    slaResolveDueAt: r.ticket.slaResolveDueAt,
    createdAt: r.ticket.createdAt,
    updatedAt: r.ticket.updatedAt,
    messageCount: 0,
  }));
}

export async function getSupportTicketCounts(): Promise<{
  open: number;
  pending: number;
  inProgress: number;
  breached: number;
  total: number;
}> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      open: sql<number>`count(*) filter (where ${supportTickets.status} = 'open')::int`,
      pending: sql<number>`count(*) filter (where ${supportTickets.status} = 'pending')::int`,
      inProgress: sql<number>`count(*) filter (where ${supportTickets.status} = 'in_progress')::int`,
      breached: sql<number>`count(*) filter (
        where ${supportTickets.status} not in ('resolved', 'closed')
        and (
          (${supportTickets.firstResponseAt} is null and ${supportTickets.slaFirstResponseDueAt} < now())
          or (${supportTickets.resolvedAt} is null and ${supportTickets.slaResolveDueAt} < now())
        )
      )::int`,
    })
    .from(supportTickets);

  return {
    total: row?.total ?? 0,
    open: row?.open ?? 0,
    pending: row?.pending ?? 0,
    inProgress: row?.inProgress ?? 0,
    breached: row?.breached ?? 0,
  };
}

export interface SupportTicketDetail extends SupportTicketListItem {
  requesterPhone: string | null;
  requesterType: SupportRequesterType;
  orderId: string | null;
  userId: string | null;
  messages: Array<{
    id: string;
    authorType: string;
    authorName: string | null;
    body: string;
    isInternal: boolean;
    createdAt: Date;
  }>;
}

export async function getSupportTicketById(
  id: string,
  opts?: { includeInternal?: boolean; tenantId?: string }
): Promise<SupportTicketDetail | null> {
  const db = getDb();
  const conditions = [eq(supportTickets.id, id)];
  if (opts?.tenantId) conditions.push(eq(supportTickets.tenantId, opts.tenantId));

  const [row] = await db
    .select({
      ticket: supportTickets,
      tenantName: tenants.name,
      assigneeEmail: users.email,
      assigneeProfile: users.profileJson,
    })
    .from(supportTickets)
    .leftJoin(tenants, eq(supportTickets.tenantId, tenants.id))
    .leftJoin(users, eq(supportTickets.assigneeId, users.id))
    .where(and(...conditions))
    .limit(1);
  if (!row) return null;

  const messageRows = await db
    .select()
    .from(supportTicketMessages)
    .where(
      opts?.includeInternal === false
        ? and(
            eq(supportTicketMessages.ticketId, id),
            eq(supportTicketMessages.isInternal, false)
          )
        : eq(supportTicketMessages.ticketId, id)
    )
    .orderBy(supportTicketMessages.createdAt);

  return {
    id: row.ticket.id,
    ticketNumber: row.ticket.ticketNumber,
    subject: row.ticket.subject,
    category: row.ticket.category,
    status: row.ticket.status,
    priority: row.ticket.priority,
    channel: row.ticket.channel,
    requesterName: row.ticket.requesterName,
    requesterEmail: row.ticket.requesterEmail,
    requesterPhone: row.ticket.requesterPhone,
    requesterType: row.ticket.requesterType,
    tenantId: row.ticket.tenantId,
    tenantName: row.tenantName,
    orderId: row.ticket.orderId,
    userId: row.ticket.userId,
    assigneeId: row.ticket.assigneeId,
    assigneeName: row.assigneeProfile?.displayName ?? row.assigneeEmail ?? null,
    firstResponseAt: row.ticket.firstResponseAt,
    slaFirstResponseDueAt: row.ticket.slaFirstResponseDueAt,
    slaResolveDueAt: row.ticket.slaResolveDueAt,
    createdAt: row.ticket.createdAt,
    updatedAt: row.ticket.updatedAt,
    messageCount: messageRows.length,
    messages: messageRows.map((m) => ({
      id: m.id,
      authorType: m.authorType,
      authorName: m.authorName,
      body: m.body,
      isInternal: m.isInternal,
      createdAt: m.createdAt,
    })),
  };
}

export async function addSupportTicketMessage(input: {
  ticketId: string;
  authorType: "requester" | "agent" | "system";
  authorUserId?: string;
  authorName?: string;
  body: string;
  isInternal?: boolean;
}): Promise<void> {
  const db = getDb();
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, input.ticketId))
    .limit(1);
  if (!ticket) throw new Error("Ticket not found");

  await db.insert(supportTicketMessages).values({
    ticketId: input.ticketId,
    authorType: input.authorType,
    authorUserId: input.authorUserId,
    authorName: input.authorName,
    body: input.body,
    isInternal: input.isInternal ?? false,
  });

  const now = new Date();
  const patch: Partial<typeof supportTickets.$inferInsert> = {
    updatedAt: now,
  };

  if (
    input.authorType === "agent" &&
    !input.isInternal &&
    !ticket.firstResponseAt
  ) {
    patch.firstResponseAt = now;
    if (ticket.status === "open") patch.status = "in_progress";
  }

  if (input.authorType === "requester" && ticket.status === "pending") {
    patch.status = "open";
  }

  await db.update(supportTickets).set(patch).where(eq(supportTickets.id, input.ticketId));
}

export async function updateSupportTicket(
  id: string,
  patch: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assigneeId?: string | null;
    category?: string;
  }
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const set: Partial<typeof supportTickets.$inferInsert> = {
    updatedAt: now,
  };
  if (patch.status !== undefined) {
    set.status = patch.status;
    if (patch.status === "resolved") set.resolvedAt = now;
    if (patch.status === "closed") {
      set.closedAt = now;
      if (!set.resolvedAt) set.resolvedAt = now;
    }
  }
  if (patch.priority !== undefined) set.priority = patch.priority;
  if (patch.assigneeId !== undefined) set.assigneeId = patch.assigneeId;
  if (patch.category !== undefined) set.category = patch.category;

  await db.update(supportTickets).set(set).where(eq(supportTickets.id, id));
}
