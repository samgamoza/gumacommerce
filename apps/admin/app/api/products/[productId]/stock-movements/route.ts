import { NextResponse } from "next/server";
import { z } from "zod";
import { listStockMovementsForProduct } from "@gumakart/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

/** Stock history for one of the seller's products (sales, restocks, edits). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { productId } = await params;
    z.string().uuid().parse(productId);
    const movements = await listStockMovementsForProduct(session.tenantId, productId);
    return NextResponse.json({ ok: true, movements });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid product id." }, { status: 400 });
    }
    console.error("[products stock-movements GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
