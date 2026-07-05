import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, tenants, users } from "@guma-commerce/db";
import {
  createSessionToken,
  sessionCookieHeader,
  verifyPassword,
  type SessionUser,
} from "@guma-commerce/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { email, password } = loginSchema.parse(await request.json());
    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    const [row] = await db
      .select({ user: users, tenant: tenants })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const invalid = () =>
      NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });

    if (!row || !row.user.passwordHash) return invalid();
    if (row.user.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: "This account is not a platform administrator." },
        { status: 403 }
      );
    }
    if (row.user.status === "suspended") {
      return NextResponse.json(
        { ok: false, error: "This account is suspended." },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, row.user.passwordHash);
    if (!valid) return invalid();

    const sessionUser: SessionUser = {
      userId: row.user.id,
      email: row.user.email ?? normalizedEmail,
      role: row.user.role,
      tenantId: row.tenant?.id ?? null,
      tenantSlug: row.tenant?.slug ?? null,
      tenantName: row.tenant?.name ?? null,
      displayName: row.user.profileJson?.displayName ?? row.user.email ?? "Admin",
      emailVerified: Boolean(row.user.emailVerifiedAt),
      needsShopSetup: false,
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ ok: true, user: sessionUser, redirectTo: "/" });
    response.headers.set("Set-Cookie", sessionCookieHeader(token));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 400 });
    }
    console.error("[platform/auth/login]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
