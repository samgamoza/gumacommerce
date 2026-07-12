import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, registerSeller, sendVerificationEmail, sessionCookieHeader } from "@guma-commerce/auth";
import { clientIpFrom, rateLimit } from "@guma-commerce/services";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(100),
  shopName: z.string().min(2).max(255),
  shopSlug: z.string().min(3).max(32),
  category: z.string().optional(),
  vibe: z.string().max(32).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(`signup:${clientIpFrom(request)}`, {
      limit: 5,
      windowSeconds: 600,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many signups from this connection. Try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

    const body = signupSchema.parse(await request.json());
    const { user, sessionToken, verificationToken } = await registerSeller(body);

    await sendVerificationEmail(user.email, verificationToken);

    if (user.tenantId && user.tenantSlug) {
      const { ensureEventsWired } = await import("@/lib/events-bootstrap");
      ensureEventsWired();
      const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
      await emitDomainEvent({
        name: EVENT_NAMES.TENANT_CREATED,
        data: {
          tenantId: user.tenantId,
          slug: user.tenantSlug,
          name: user.tenantName ?? body.shopName,
          plan: "free",
        },
        idempotencyKey: `Tenant.Created.V1:${user.tenantId}`,
      });
    }

    const response = NextResponse.json({
      ok: true,
      user,
      redirectTo: "/launch",
    });

    response.headers.set("Set-Cookie", sessionCookieHeader(sessionToken));
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid input", code: "VALIDATION" },
        { status: 400 }
      );
    }
    console.error("[auth/signup]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
