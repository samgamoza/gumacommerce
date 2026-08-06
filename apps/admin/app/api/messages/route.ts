import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listShopChatMessages,
  listShopChatSessions,
  saveShopChatMessage,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const session = await requireTenantSession();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const messages = await listShopChatMessages({
        tenantId: session.tenantId,
        sessionId,
      });
      return NextResponse.json({ ok: true, messages });
    }

    const sessions = await listShopChatSessions(session.tenantId);
    return NextResponse.json({ ok: true, sessions });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[messages GET]", error);
    return NextResponse.json({ ok: false, error: "Could not load messages." }, { status: 500 });
  }
}

const postSchema = z.object({
  sessionId: z.string().min(8).max(64),
  message: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = postSchema.parse(await request.json());

    const saved = await saveShopChatMessage({
      tenantId: session.tenantId,
      sessionId: body.sessionId,
      role: "seller",
      content: body.message,
    });

    return NextResponse.json({ ok: true, message: saved });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid message." }, { status: 400 });
    }
    console.error("[messages POST]", error);
    return NextResponse.json({ ok: false, error: "Could not send message." }, { status: 500 });
  }
}
