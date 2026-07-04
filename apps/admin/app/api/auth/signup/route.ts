import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, registerSeller, sendVerificationEmail, sessionCookieHeader } from "@guma-commerce/auth";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(100),
  shopName: z.string().min(2).max(255),
  shopSlug: z.string().min(3).max(32),
  category: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const { user, sessionToken, verificationToken } = await registerSeller(body);

    await sendVerificationEmail(user.email, verificationToken);

    const response = NextResponse.json({
      ok: true,
      user,
      redirectTo: "/onboarding",
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
