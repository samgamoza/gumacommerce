import {
  createPayMongoClient,
  type PayMongoMethod,
} from "./paymongo";
import { allowIntegrationMocks } from "../config/integrations";

export type CheckoutPaymentMethod =
  | "gcash"
  | "paymaya"
  | "qrph"
  | "card"
  | "cod"
  | "bank";

export type PaymentAdapterId = "cod" | "paymongo" | "manual_ewallet";

export type PaymentsMode = "manual_ewallet" | "paymongo" | "both";

/** Beta default: direct GCash/Maya/bank until PayMongo is secured. */
export function resolvePaymentsMode(input?: {
  settingsMode?: string | null;
  envMode?: string | null;
}): PaymentsMode {
  const raw = (
    input?.settingsMode ||
    input?.envMode ||
    process.env.PAYMENTS_MODE ||
    "manual_ewallet"
  )
    .trim()
    .toLowerCase();
  if (raw === "paymongo" || raw === "both") return raw;
  return "manual_ewallet";
}

function paymongoConfigured(): boolean {
  const key = process.env.PAYMONGO_SECRET_KEY?.trim() ?? "";
  if (!key || key.startsWith("sk_test_xxx")) return false;
  return true;
}

/**
 * Resolve which payment adapter handles this checkout method.
 * - COD → cod
 * - manual_ewallet mode → never hits PayMongo
 * - paymongo mode → PayMongo (fails closed in prod without keys)
 * - both → PayMongo when configured, else manual_ewallet bridge
 */
export function resolvePaymentAdapterId(
  method: CheckoutPaymentMethod,
  mode: PaymentsMode = resolvePaymentsMode()
): PaymentAdapterId {
  if (method === "cod") return "cod";
  if (mode === "manual_ewallet") return "manual_ewallet";
  if (mode === "paymongo") return "paymongo";
  // both
  if (paymongoConfigured() || allowIntegrationMocks()) return "paymongo";
  return "manual_ewallet";
}

export interface StartOnlinePaymentInput {
  amountCentavos: number;
  description: string;
  method: Exclude<CheckoutPaymentMethod, "cod" | "bank">;
  metadata: Record<string, string>;
}

export interface StartOnlinePaymentResult {
  adapter: "paymongo";
  paymentIntentId: string;
  clientKey: string;
  redirectUrl: string | null;
}

/**
 * Thin payment adapter facade — COD and manual_ewallet are handled by the order layer;
 * online gateway methods route through PayMongo only.
 */
export async function startOnlinePayment(
  input: StartOnlinePaymentInput
): Promise<StartOnlinePaymentResult> {
  const paymongo = createPayMongoClient();
  const intent = await paymongo.createPaymentIntent({
    amountCentavos: input.amountCentavos,
    description: input.description,
    methods: [input.method as PayMongoMethod],
    metadata: input.metadata,
  });
  const attached = await paymongo.attachPaymentMethod(
    intent.id,
    input.method as PayMongoMethod,
    intent.clientKey
  );
  return {
    adapter: "paymongo",
    paymentIntentId: intent.id,
    clientKey: intent.clientKey,
    redirectUrl: attached.redirectUrl ?? null,
  };
}

export interface ManualEwalletInstructions {
  adapter: "manual_ewallet";
  method: "gcash" | "paymaya" | "bank";
  amount: string;
  orderNumber: string;
  accountName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  note: string;
  chatHint: string;
}

export function buildManualEwalletInstructions(input: {
  method: "gcash" | "paymaya" | "bank" | "qrph" | "card";
  amount: string;
  orderNumber: string;
  receiving?: {
    gcashNumber?: string;
    gcashName?: string;
    mayaNumber?: string;
    mayaName?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
  } | null;
}): ManualEwalletInstructions {
  const method: "gcash" | "paymaya" | "bank" =
    input.method === "paymaya"
      ? "paymaya"
      : input.method === "bank"
        ? "bank"
        : "gcash";

  const receiving = input.receiving ?? {};
  let accountName: string | null = null;
  let accountNumber: string | null = null;
  let bankName: string | null = null;

  if (method === "gcash") {
    accountName = receiving.gcashName?.trim() || null;
    accountNumber = receiving.gcashNumber?.trim() || null;
  } else if (method === "paymaya") {
    accountName = receiving.mayaName?.trim() || null;
    accountNumber = receiving.mayaNumber?.trim() || null;
  } else {
    accountName = receiving.bankAccountName?.trim() || null;
    accountNumber = receiving.bankAccountNumber?.trim() || null;
    bankName = receiving.bankName?.trim() || null;
  }

  return {
    adapter: "manual_ewallet",
    method,
    amount: input.amount,
    orderNumber: input.orderNumber,
    accountName,
    accountNumber,
    bankName,
    note: `Send exactly ${input.amount} and put ${input.orderNumber} in the transfer message/notes.`,
    chatHint:
      "After sending, message the shop in-chat with your reference number so they can confirm payment.",
  };
}
