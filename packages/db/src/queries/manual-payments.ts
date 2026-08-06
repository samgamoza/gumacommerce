import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { orderStatusHistory, orders, paymentTransactions } from "../schema/index";
import { creditSaleForOrder } from "./wallet";

export type PaymentsReceivingAccounts = {
  gcashNumber?: string;
  gcashName?: string;
  mayaNumber?: string;
  mayaName?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
};

export type TenantPaymentsSettings = {
  mode?: "manual_ewallet" | "paymongo" | "both";
  receiving?: PaymentsReceivingAccounts;
};

export function resolveTenantPaymentsSettings(
  settingsJson: Record<string, unknown> | null | undefined
): TenantPaymentsSettings {
  const payments = settingsJson?.payments as TenantPaymentsSettings | undefined;
  return {
    mode: payments?.mode,
    receiving: payments?.receiving ?? {},
  };
}

export async function recordManualPaymentIntent(params: {
  orderId: string;
  tenantId: string;
  amount: string;
  methodType: string;
  orderNumber: string;
}): Promise<string> {
  const db = getDb();
  const gatewayIntentId = `manual_${params.orderId}`;
  await db.insert(paymentTransactions).values({
    orderId: params.orderId,
    tenantId: params.tenantId,
    gateway: "manual",
    gatewayIntentId,
    amount: params.amount,
    status: "pending",
    methodType: params.methodType,
    rawWebhookJson: {
      adapter: "manual_ewallet",
      orderNumber: params.orderNumber,
    },
  });
  return gatewayIntentId;
}

export async function submitManualPaymentReference(params: {
  tenantId: string;
  orderId: string;
  reference: string;
  proofUrl?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, params.orderId), eq(orders.tenantId, params.tenantId)))
    .limit(1);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: true };

  const [txn] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.orderId, params.orderId),
        eq(paymentTransactions.gateway, "manual")
      )
    )
    .limit(1);

  const meta = {
    adapter: "manual_ewallet",
    orderNumber: order.orderNumber,
    buyerReference: params.reference.trim(),
    proofUrl: params.proofUrl?.trim() || null,
    submittedAt: new Date().toISOString(),
  };

  if (txn) {
    await db
      .update(paymentTransactions)
      .set({
        status: "processing",
        rawWebhookJson: meta,
      })
      .where(eq(paymentTransactions.id, txn.id));
  } else {
    await db.insert(paymentTransactions).values({
      orderId: params.orderId,
      tenantId: params.tenantId,
      gateway: "manual",
      gatewayIntentId: `manual_${params.orderId}`,
      amount: order.total,
      status: "processing",
      methodType: order.paymentMethod,
      rawWebhookJson: meta,
    });
  }

  await db.insert(orderStatusHistory).values({
    orderId: params.orderId,
    status: order.status,
    note: `Buyer submitted payment reference: ${params.reference.trim()}`,
  });

  return { ok: true };
}

/** Seller confirms a direct e-wallet / bank transfer. Idempotent. */
export async function confirmManualOrderPayment(params: {
  tenantId: string;
  orderId: string;
  actorId?: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string; orderNumber?: string; transitioned?: boolean }> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, params.orderId), eq(orders.tenantId, params.tenantId)))
    .limit(1);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.paymentMethod === "cod") {
    return { ok: false, error: "COD orders are not confirmed via e-wallet payment." };
  }

  const now = new Date();
  let transitioned = false;

  if (order.status === "pending_payment") {
    await db
      .update(orders)
      .set({ status: "paid", paymentStatus: "paid", paidAt: now })
      .where(eq(orders.id, order.id));
    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      status: "paid",
      note: params.note ?? "Payment confirmed by seller (direct e-wallet)",
      actorId: params.actorId,
    });
    transitioned = true;
  } else if (order.paymentStatus !== "paid") {
    await db
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: now })
      .where(eq(orders.id, order.id));
    transitioned = true;
  }

  const [txn] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.orderId, order.id),
        eq(paymentTransactions.gateway, "manual")
      )
    )
    .limit(1);

  if (txn) {
    await db
      .update(paymentTransactions)
      .set({
        status: "paid",
        paidAt: now,
        rawWebhookJson: {
          ...(typeof txn.rawWebhookJson === "object" && txn.rawWebhookJson
            ? (txn.rawWebhookJson as object)
            : {}),
          confirmedAt: now.toISOString(),
          confirmedBy: params.actorId ?? null,
        },
      })
      .where(eq(paymentTransactions.id, txn.id));
  } else {
    await db.insert(paymentTransactions).values({
      orderId: order.id,
      tenantId: order.tenantId,
      gateway: "manual",
      gatewayIntentId: `manual_${order.id}`,
      amount: order.total,
      status: "paid",
      methodType: order.paymentMethod,
      paidAt: now,
      rawWebhookJson: {
        adapter: "manual_ewallet",
        confirmedAt: now.toISOString(),
        confirmedBy: params.actorId ?? null,
      },
    });
  }

  if (transitioned) {
    await creditSaleForOrder(order.id);
  }

  return { ok: true, orderNumber: order.orderNumber, transitioned };
}

export async function getManualPaymentMetaForOrder(
  orderId: string
): Promise<{
  status: string;
  buyerReference: string | null;
  proofUrl: string | null;
} | null> {
  const db = getDb();
  const [txn] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(eq(paymentTransactions.orderId, orderId), eq(paymentTransactions.gateway, "manual"))
    )
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(1);
  if (!txn) return null;
  const raw = (txn.rawWebhookJson ?? {}) as {
    buyerReference?: string;
    proofUrl?: string | null;
  };
  return {
    status: txn.status,
    buyerReference: raw.buyerReference ?? null,
    proofUrl: raw.proofUrl ?? null,
  };
}
