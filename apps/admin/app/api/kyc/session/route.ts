import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getKycSessionByToken,
  updateKycSession,
  type KycIdPath,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { isPrimaryId, isSecondaryId } from "@/lib/kyc-id-types";

const patchSchema = z.object({
  sessionId: z.string().uuid(),
  idPath: z.enum(["primary", "secondary"]).optional(),
  primaryIdType: z.string().max(64).nullable().optional(),
  secondaryIdType1: z.string().max(64).nullable().optional(),
  secondaryIdType2: z.string().max(64).nullable().optional(),
});

const tokenPatchSchema = patchSchema.omit({ sessionId: true });

function validateIdTypes(body: z.infer<typeof patchSchema>): string | null {
  if (body.idPath === "primary" && body.primaryIdType && !isPrimaryId(body.primaryIdType)) {
    return "Invalid primary ID type.";
  }
  if (body.secondaryIdType1 && !isSecondaryId(body.secondaryIdType1)) {
    return "Invalid secondary ID type.";
  }
  if (body.secondaryIdType2 && !isSecondaryId(body.secondaryIdType2)) {
    return "Invalid secondary ID type.";
  }
  return null;
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get("x-kyc-token");
    let tenantId: string;
    let sessionId: string;
    let body: z.infer<typeof patchSchema>;

    if (token) {
      const parsed = tokenPatchSchema.parse(await request.json());
      const session = await getKycSessionByToken(token);
      if (!session) {
        return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 404 });
      }
      tenantId = session.tenantId;
      sessionId = session.id;
      body = { ...parsed, sessionId: session.id };
    } else {
      body = patchSchema.parse(await request.json());
      const auth = await requireTenantSession();
      tenantId = auth.tenantId;
      sessionId = body.sessionId;
    }

    const idError = validateIdTypes(body);
    if (idError) {
      return NextResponse.json({ ok: false, error: idError }, { status: 400 });
    }

    const updated = await updateKycSession({
      sessionId,
      tenantId,
      idPath: body.idPath as KycIdPath | undefined,
      primaryIdType: body.primaryIdType,
      secondaryIdType1: body.secondaryIdType1,
      secondaryIdType2: body.secondaryIdType2,
    });

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Session not found or already submitted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, session: updated });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("[kyc/session PATCH]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const token = request.headers.get("x-kyc-token") ?? new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
  }

  const session = await getKycSessionByToken(token);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, session });
}
