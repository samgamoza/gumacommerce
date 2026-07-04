import { NextResponse } from "next/server";
import { z } from "zod";
import {
  readProductImageBuffer,
  saveEnhancedProductImage,
} from "@/lib/product-uploads";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { enhanceProductPhoto } from "@/lib/product-enhance";

export const maxDuration = 120;

const enhanceSchema = z.object({
  imageUrl: z.string().min(1).max(2048),
});

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = enhanceSchema.parse(await request.json());

    const inputBuffer = await readProductImageBuffer(session.tenantId, body.imageUrl);
    const enhancedBuffer = await enhanceProductPhoto(inputBuffer);
    const saved = await saveEnhancedProductImage(session.tenantId, enhancedBuffer);

    return NextResponse.json({
      ok: true,
      url: saved.url,
      originalUrl: body.imageUrl,
    });
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
    if (error instanceof Error) {
      console.error("[products/enhance-image POST]", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Background removal failed." },
        { status: 500 }
      );
    }
    console.error("[products/enhance-image POST]", error);
    return NextResponse.json({ ok: false, error: "Background removal failed." }, { status: 500 });
  }
}
