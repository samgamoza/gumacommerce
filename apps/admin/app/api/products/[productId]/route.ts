import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteProductForTenant, markChangeRequestPublished, updateProductForTenant } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const patchSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  descriptionHtml: z.string().max(20000).optional(),
  basePrice: z.number().positive().max(999999).optional(),
  compareAtPrice: z.number().positive().max(999999).nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  stockQty: z.number().int().min(0).max(99999).optional(),
  imageUrl: z.string().max(2048).nullable().optional(),
  changeRequestId: z.string().uuid().optional(),
});

const idSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { productId } = await params;
    const id = idSchema.parse(productId);
    const body = patchSchema.parse(await request.json());

    const updated = await updateProductForTenant(session.tenantId, id, {
      title: body.title,
      descriptionHtml: body.descriptionHtml,
      basePrice: body.basePrice !== undefined ? body.basePrice.toFixed(2) : undefined,
      compareAtPrice:
        body.compareAtPrice === undefined
          ? undefined
          : body.compareAtPrice === null
            ? null
            : body.compareAtPrice.toFixed(2),
      status: body.status,
      stockQty: body.stockQty,
      imageUrl: body.imageUrl,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }

    if (body.changeRequestId) {
      await markChangeRequestPublished({
        id: body.changeRequestId,
        tenantId: session.tenantId,
        actorUserId: session.userId,
        actorEmail: session.email ?? null,
        productId: id,
      });
      try {
        const { ensureEventsWired } = await import("@/lib/events-bootstrap");
        ensureEventsWired();
        const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
        await emitDomainEvent({
          name: EVENT_NAMES.PRICING_CHANGE_APPROVED,
          data: {
            tenantId: session.tenantId,
            changeRequestId: body.changeRequestId,
            productId: id,
            basePrice: body.basePrice !== undefined ? String(body.basePrice) : undefined,
          },
          idempotencyKey: `Pricing.ChangeApproved.V1:${body.changeRequestId}`,
        });
      } catch (err) {
        console.error("[products PATCH] pricing event", err);
      }
    }

    return NextResponse.json({ ok: true });
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
    console.error("[products PATCH]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { productId } = await params;
    const id = idSchema.parse(productId);

    const result = await deleteProductForTenant(session.tenantId, id);
    if (result === "not_found") {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid product id." }, { status: 400 });
    }
    console.error("[products DELETE]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
