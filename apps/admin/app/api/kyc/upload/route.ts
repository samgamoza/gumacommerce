import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getKycSessionById,
  getKycSessionByToken,
  upsertKycDocument,
  type KycDocType,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { saveKycImage } from "@/lib/kyc-uploads";

const DOC_TYPES = ["primary_id", "secondary_id_1", "secondary_id_2", "selfie"] as const;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const docType = formData.get("docType");
    const idCategory = formData.get("idCategory");
    const sessionIdField = formData.get("sessionId");
    const token = formData.get("token")?.toString() ?? request.headers.get("x-kyc-token");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Choose a photo." }, { status: 400 });
    }

    const parsedDocType = z.enum(DOC_TYPES).safeParse(docType);
    if (!parsedDocType.success) {
      return NextResponse.json({ ok: false, error: "Invalid document type." }, { status: 400 });
    }

    let tenantId: string;
    let sessionId: string;

    if (token) {
      const session = await getKycSessionByToken(token);
      if (!session) {
        return NextResponse.json({ ok: false, error: "Invalid or expired link." }, { status: 404 });
      }
      tenantId = session.tenantId;
      sessionId = session.id;
    } else {
      const auth = await requireTenantSession();
      tenantId = auth.tenantId;
      const parsedSessionId = z.string().uuid().safeParse(sessionIdField);
      if (!parsedSessionId.success) {
        return NextResponse.json({ ok: false, error: "Missing session." }, { status: 400 });
      }
      const session = await getKycSessionById(tenantId, parsedSessionId.data);
      if (!session) {
        return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
      }
      sessionId = session.id;
    }

    const saved = await saveKycImage(tenantId, file);
    const document = await upsertKycDocument({
      sessionId,
      tenantId,
      docType: parsedDocType.data as KycDocType,
      idCategory: typeof idCategory === "string" ? idCategory : null,
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
    });

    return NextResponse.json({ ok: true, document });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[kyc/upload POST]", error);
    return NextResponse.json({ ok: false, error: "Upload failed." }, { status: 500 });
  }
}
