import { NextResponse } from "next/server";
import { saveProductImage } from "@/lib/product-uploads";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Choose an image file." }, { status: 400 });
    }

    const saved = await saveProductImage(session.tenantId, file);

    return NextResponse.json({ ok: true, url: saved.url, filename: saved.filename });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[products/upload POST]", error);
    return NextResponse.json({ ok: false, error: "Upload failed." }, { status: 500 });
  }
}
