import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, loginUser, sessionCookieHeader } from "@guma-commerce/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const { user, sessionToken } = await loginUser(body);

    const response = NextResponse.json({
      ok: true,
      user,
      redirectTo: user.emailVerified ? "/" : "/onboarding",
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
