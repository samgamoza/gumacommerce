import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSupportTicket,
  getSupportTicketById,
  listSupportTickets,
  addSupportTicketMessage,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const createSchema = z.object({
  subject: z.string().trim().min(4).max(200),
  category: z.enum(["billing", "delivery", "account", "technical", "general"]).default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  body: z.string().trim().min(10).max(5000),
});

const replySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

export async function GET() {
  try {
    const session = await requireTenantSession();
    const tickets = await listSupportTickets({ tenantId: session.tenantId, limit: 50 });
    return NextResponse.json({ ok: true, tickets });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "Could not load tickets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const json = await request.json();

    if (json?.ticketId) {
      const body = replySchema.parse(json);
      const existing = await getSupportTicketById(body.ticketId, {
        tenantId: session.tenantId,
        includeInternal: false,
      });
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Ticket not found." }, { status: 404 });
      }
      await addSupportTicketMessage({
        ticketId: body.ticketId,
        authorType: "requester",
        authorUserId: session.userId,
        authorName: session.displayName || session.email,
        body: body.body,
        isInternal: false,
      });
      return NextResponse.json({ ok: true });
    }

    const body = createSchema.parse(json);
    const ticket = await createSupportTicket({
      channel: "seller_admin",
      requesterType: "seller_user",
      requesterName: session.displayName || session.email,
      requesterEmail: session.email,
      userId: session.userId,
      tenantId: session.tenantId,
      subject: body.subject,
      category: body.category,
      priority: body.priority,
      body: body.body,
    });

    return NextResponse.json({
      ok: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: false, error: "Could not save ticket." }, { status: 500 });
  }
}
