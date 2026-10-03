import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../client";
import { paymentTransactions } from "../schema/index";
import { applyOrderAction } from "./order-lifecycle";
import { OrderError } from "./order-status";

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

/**
 * Buyer sent a GCash/Maya/bank reference and/or screenshot → payment is
 * "pending verification" until the seller confirms (or rejects) it.
 */
export async function submitManualPaymentReference(params: {
  tenantId: string;
  orderId: string;
  reference: string;
  proofUrl?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await applyOrderAction({
      orderId: params.orderId,
      tenantId: params.tenantId,
      action: { type: "submit_payment_proof" },
      source: "buyer",
      note: `Buyer sent payment details (ref ${params.reference.trim().slice(0, 60)})`,
      payment: {
        reference: params.reference.trim().slice(0, 120),
        proofUrl: params.proofUrl?.trim() || null,
      },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof OrderError) {
      if (error.message === "This order is already paid.") return { ok: true };
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/** Seller confirms a direct e-wallet / bank transfer (or cash collected for COD). */
export async function confirmManualOrderPayment(params: {
  tenantId: string;
  orderId: string;
  actorId?: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string; orderNumber?: string; transitioned?: boolean }> {
  try {
    const result = await applyOrderAction({
      orderId: params.orderId,
      tenantId: params.tenantId,
      action: { type: "confirm_payment" },
      source: "seller",
      actorId: params.actorId,
      note: params.note,
    });
    return { ok: true, orderNumber: result.orderNumber, transitioned: result.changed };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Seller didn't receive the money: back to "unpaid" so the buyer can pay again. */
export async function rejectManualPaymentProof(params: {
  tenantId: string;
  orderId: string;
  actorId?: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await applyOrderAction({
      orderId: params.orderId,
      tenantId: params.tenantId,
      action: { type: "reject_payment_proof" },
      source: "seller",
      actorId: params.actorId,
      note: params.note,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    throw error;
  }
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
    buyerReference: txn.reference ?? raw.buyerReference ?? null,
    proofUrl: txn.proofUrl ?? raw.proofUrl ?? null,
  };
}
