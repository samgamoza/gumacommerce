import { NextResponse } from "next/server";
import { z } from "zod";
import { deletePushSubscription, savePushSubscription } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1024),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

/** Returns the public VAPID key so the client can subscribe. */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  return NextResponse.json({ ok: Boolean(publicKey), publicKey });
}

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = subscribeSchema.parse(await request.json());

    await savePushSubscription({
      tenantId: session.tenantId,
      userId: session.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid subscription." }, { status: 400 });
    }
    console.error("[push/subscribe POST]", error);
    return NextResponse.json({ ok: false, error: "Could not save subscription." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireTenantSession();
    const body = z.object({ endpoint: z.string().url().max(1024) }).parse(await request.json());
    await deletePushSubscription(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "Could not remove subscription." }, { status: 400 });
  }
}
