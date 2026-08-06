import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrderForTracking,
  getTenantIdBySlug,
  submitManualPaymentReference,
} from "@guma-commerce/db";
import { clientIpFrom, rateLimit } from "@guma-commerce/services";

const schema = z
  .object({
    tenantSlug: z.string().min(1),
    orderNumber: z.string().min(1),
    reference: z.string().trim().max(120).optional().default(""),
    proofUrl: z
      .string()
      .max(800)
      .optional()
      .or(z.literal(""))
      .transform((v) => v || ""),
  })
  .superRefine((val, ctx) => {
    const hasRef = val.reference.trim().length >= 4;
    const hasProof =
      val.proofUrl.startsWith("http") || val.proofUrl.startsWith("/uploads/payment-proofs/");
    if (!hasRef && !hasProof) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a reference number or payment screenshot.",
        path: ["reference"],
      });
    }
    if (
      val.proofUrl &&
      !val.proofUrl.startsWith("http") &&
      !val.proofUrl.startsWith("/uploads/payment-proofs/")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid proof URL.",
        path: ["proofUrl"],
      });
    }
  });

/** Buyer submits GCash/Maya/bank reference and/or screenshot after direct transfer. */
export async function POST(request: Request) {
  try {
    const limited = await rateLimit(`pay-ref:${clientIpFrom(request)}`, {
      limit: 10,
      windowSeconds: 60,
    });
    if (!limited.allowed) {
      return NextResponse.json({ ok: false, error: "Too many attempts." }, { status: 429 });
    }

    const body = schema.parse(await request.json());
    const order = await getOrderForTracking(body.tenantSlug, body.orderNumber);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }

    const tenantId = await getTenantIdBySlug(body.tenantSlug);
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const reference =
      body.reference.trim().length >= 4
        ? body.reference.trim()
        : `screenshot-${order.orderNumber}`;

    const result = await submitManualPaymentReference({
      tenantId,
      orderId: order.orderId,
      reference,
      proofUrl: body.proofUrl || null,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }
    console.error("[payment-reference]", error);
    return NextResponse.json({ ok: false, error: "Could not save reference." }, { status: 500 });
  }
}
