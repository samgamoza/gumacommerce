import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getKycSessionById,
  getKycSessionByToken,
  KycValidationError,
  submitKycSession,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-kyc-token");
    let sessionId: string;
    let tenantId: string;

    if (token) {
      const session = await getKycSessionByToken(token);
      if (!session) {
        return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 404 });
      }
      sessionId = session.id;
      tenantId = session.tenantId;
    } else {
      const auth = await requireTenantSession();
      const body = bodySchema.parse(await request.json());
      const session = await getKycSessionById(auth.tenantId, body.sessionId);
      if (!session) {
        return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
      }
      sessionId = session.id;
      tenantId = auth.tenantId;
    }

    const updated = await submitKycSession(tenantId, sessionId);
    return NextResponse.json({ ok: true, session: updated, verified: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof KycValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("[kyc/submit POST]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
