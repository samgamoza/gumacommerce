import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderError, updateOrderStatusForTenant } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const patchSchema = z.object({
  status: z.enum([
    "paid",
    "accepted",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { orderId } = await params;
    const body = patchSchema.parse(await request.json());

    const status = await updateOrderStatusForTenant({
      tenantId: session.tenantId,
      orderId,
      status: body.status,
      note: body.note,
      actorId: session.userId,
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof OrderError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid status." },
        { status: 400 }
      );
    }
    console.error("[orders PATCH]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
