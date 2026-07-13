import {
  createPayMongoClient,
  type PayMongoMethod,
} from "./paymongo";

export type CheckoutPaymentMethod = "gcash" | "paymaya" | "qrph" | "card" | "cod";

export type PaymentAdapterId = "cod" | "paymongo";

export function resolvePaymentAdapterId(method: CheckoutPaymentMethod): PaymentAdapterId {
  return method === "cod" ? "cod" : "paymongo";
}

export interface StartOnlinePaymentInput {
  amountCentavos: number;
  description: string;
  method: Exclude<CheckoutPaymentMethod, "cod">;
  metadata: Record<string, string>;
}

export interface StartOnlinePaymentResult {
  adapter: "paymongo";
  paymentIntentId: string;
  clientKey: string;
  redirectUrl: string | null;
}

/**
 * Thin payment adapter facade — COD is handled by the order layer;
 * online methods currently route through PayMongo only.
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
