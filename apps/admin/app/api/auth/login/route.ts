import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, loginUser, sessionCookieHeader } from "@guma-commerce/auth";
import { resolveSellerHomePath } from "@guma-commerce/db";
import { clientIpFrom, rateLimit } from "@guma-commerce/services";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(`login:${clientIpFrom(request)}`, {
      limit: 10,
      windowSeconds: 300,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many login attempts. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

    const body = loginSchema.parse(await request.json());
    const { user, sessionToken } = await loginUser(body);

    const redirectTo = await resolveSellerHomePath({
      tenantId: user.tenantId,
      emailVerified: user.emailVerified,
      preferLaunchWhenUnverified: true,
    });

    const response = NextResponse.json({
      ok: true,
      user,
      redirectTo,
    });

    response.headers.set("Set-Cookie", sessionCookieHeader(sessionToken));
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 400 });
    }
    console.error("[auth/login]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
