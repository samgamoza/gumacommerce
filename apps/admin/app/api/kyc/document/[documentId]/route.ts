import { NextResponse } from "next/server";
import {
  getKycDocumentByToken,
  getKycDocumentStorageKey,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { readKycImageBuffer } from "@/lib/kyc-uploads";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const token = request.headers.get("x-kyc-token") ?? new URL(request.url).searchParams.get("token");

    let storage: { storageKey: string; mimeType: string } | null = null;

    if (token) {
      storage = await getKycDocumentByToken(token, documentId);
    } else {
      const session = await requireTenantSession();
      storage = await getKycDocumentStorageKey(session.tenantId, documentId);
    }

    if (!storage) {
      return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
    }

    const buffer = await readKycImageBuffer(storage.storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": storage.mimeType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[kyc/document GET]", error);
    return NextResponse.json({ ok: false, error: "Could not load document." }, { status: 500 });
  }
}
