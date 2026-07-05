import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderPaymentForRefund, markOrderRefunded } from "@guma-commerce/db";
import { createLogger, createPayMongoClient } from "@guma-commerce/services";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const log = createLogger("orders:refund");

/**
 * Refunds a paid order. Online payments are refunded through the PayMongo
 * refunds API; COD orders (cash already collected) are just marked refunded
 * so the seller can hand the cash back.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { orderId } = await params;
    z.string().uuid().parse(orderId);

    const order = await getOrderPaymentForRefund(session.tenantId, orderId);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    if (order.status === "refunded") {
      return NextResponse.json(
        { ok: false, error: "This order is already refunded." },
        { status: 409 }
      );
    }
    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { ok: false, error: "Only paid orders can be refunded." },
        { status: 400 }
      );
    }

    let note = "Refund issued by seller";
    if (order.paymentMethod !== "cod") {
      if (!order.gatewayPaymentId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "No gateway payment reference found for this order — contact support to refund manually.",
          },
          { status: 400 }
        );
      }
      const refund = await createPayMongoClient().createRefund({
        paymentId: order.gatewayPaymentId,
        amountCentavos: order.totalCentavos,
        reason: "requested_by_customer",
        notes: `Refund for order ${order.orderNumber}`,
      });
      note = `PayMongo refund ${refund.id} (${refund.status})`;
    } else {
      note = "COD refund — return cash to the customer";
    }

    await markOrderRefunded({
      tenantId: session.tenantId,
      orderId: order.orderId,
      actorId: session.userId,
      note,
    });

    return NextResponse.json({ ok: true, status: "refunded" });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid order id." }, { status: 400 });
    }
    log.error("Refund failed", error);
    return NextResponse.json(
      { ok: false, error: "Refund failed. Try again or contact support." },
      { status: 502 }
    );
  }
}
