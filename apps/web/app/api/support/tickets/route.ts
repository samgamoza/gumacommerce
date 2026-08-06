import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupportTicket } from "@guma-commerce/db";
import { clientIpFrom, createLogger, rateLimit } from "@guma-commerce/services";

const log = createLogger("support:public");

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  topic: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(5000),
  category: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(`support-ticket:${clientIpFrom(request)}`, {
      limit: 5,
      windowSeconds: 60 * 15,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

    const body = schema.parse(await request.json());
    const ticket = await createSupportTicket({
      channel: "web_contact",
      requesterType: "anonymous",
      requesterName: body.name,
      requesterEmail: body.email,
      requesterPhone: body.phone,
      subject: body.topic.slice(0, 200),
      category: body.category ?? "general",
      priority: "normal",
      body: body.message,
    });

    return NextResponse.json({
      ok: true,
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    log.error("Public ticket create failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not create your support ticket." },
      { status: 500 }
    );
  }
}
