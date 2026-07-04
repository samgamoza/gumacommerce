import { NextResponse } from "next/server";
import { z } from "zod";
import { createProductForTenant, listProductsForTenant } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const products = await listProductsForTenant(session.tenantId);
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[products GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

const createSchema = z.object({
  title: z.string().min(2).max(255),
  slug: z.string().optional(),
  descriptionHtml: z.string().optional(),
  basePrice: z.number().positive().max(999999),
  compareAtPrice: z.number().positive().max(999999).optional().nullable(),
  status: z.enum(["draft", "active"]).optional(),
  stockQty: z.number().int().min(0).max(99999).optional(),
  aiGenerated: z.boolean().optional(),
  imageUrl: z.string().max(2048).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = createSchema.parse(await request.json());

    const product = await createProductForTenant(session.tenantId, {
      title: body.title,
      slug: body.slug ?? body.title,
      descriptionHtml: body.descriptionHtml,
      basePrice: body.basePrice.toFixed(2),
      compareAtPrice: body.compareAtPrice ? body.compareAtPrice.toFixed(2) : undefined,
      status: body.status ?? "active",
      stockQty: body.stockQty,
      aiGenerated: body.aiGenerated ?? false,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid product data." },
        { status: 400 }
      );
    }
    console.error("[products POST]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
