import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderForTracking, getTenantIdBySlug } from "@guma-commerce/db";
import { clientIpFrom, rateLimit } from "@guma-commerce/services";
import { savePaymentProofImage } from "@/lib/payment-proof-uploads";

/**
 * Buyer uploads a GCash/Maya/bank transfer screenshot as payment proof.
 */
export async function POST(request: Request) {
  try {
    const limited = await rateLimit(`pay-proof:${clientIpFrom(request)}`, {
      limit: 8,
      windowSeconds: 60,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many uploads. Wait a minute and try again." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const tenantSlug = String(formData.get("tenantSlug") ?? "").trim();
    const orderNumber = String(formData.get("orderNumber") ?? "").trim();
    const file = formData.get("file");

    z.object({
      tenantSlug: z.string().min(1).max(64),
      orderNumber: z.string().min(1).max(64),
    }).parse({ tenantSlug, orderNumber });

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Choose a screenshot image." }, { status: 400 });
    }

    const tenantId = await getTenantIdBySlug(tenantSlug);
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const order = await getOrderForTracking(tenantSlug, orderNumber);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ ok: false, error: "This order is already paid." }, { status: 400 });
    }
    if (order.paymentMethod === "cod") {
      return NextResponse.json(
        { ok: false, error: "COD orders do not need a payment screenshot." },
        { status: 400 }
      );
    }

    const saved = await savePaymentProofImage({ tenantSlug, orderNumber, file });
    return NextResponse.json({ ok: true, url: saved.url, filename: saved.filename });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid order." }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[payment-proof upload]", error);
    return NextResponse.json({ ok: false, error: "Upload failed." }, { status: 500 });
  }
}
