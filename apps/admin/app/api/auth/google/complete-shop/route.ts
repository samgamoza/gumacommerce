import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, completeGoogleShopSetup, sessionCookieHeader } from "@guma-commerce/auth";
import { getSessionFromRequest } from "@/lib/session";

const schema = z.object({
  shopName: z.string().min(2).max(255),
  shopSlug: z.string().min(3).max(32),
  category: z.string().optional(),
  vibe: z.string().max(32).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
    }
    if (!session.needsShopSetup) {
      return NextResponse.json({ ok: false, error: "Shop already set up." }, { status: 400 });
    }

    const body = schema.parse(await request.json());
    const { user, sessionToken } = await completeGoogleShopSetup({
      userId: session.userId,
      ...body,
    });

    const response = NextResponse.json({
      ok: true,
      user,
      redirectTo: user.emailVerified ? "/" : "/onboarding",
    });
    response.headers.set("Set-Cookie", sessionCookieHeader(sessionToken));
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid shop details." }, { status: 400 });
    }
    console.error("[auth/google/complete-shop]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
