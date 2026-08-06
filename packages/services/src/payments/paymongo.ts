import { createHmac, timingSafeEqual } from "crypto";
import {
  assertIntegrationReady,
  allowIntegrationMocks,
} from "../config/integrations";
import { createLogger } from "../logging";

const PAYMONGO_API = "https://api.paymongo.com/v1";
const log = createLogger("paymongo");

export type PayMongoMethod = "gcash" | "paymaya" | "qrph" | "card";

export interface CreatePaymentIntentInput {
  amountCentavos: number;
  description: string;
  methods?: PayMongoMethod[];
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientKey: string;
  status: string;
  amount: number;
  /** True when this response is a labeled local/test mock — never set in production. */
  mock?: boolean;
}

export interface AttachPaymentMethodResult {
  redirectUrl?: string;
  status: string;
  mock?: boolean;
}

function isUsableSecret(secretKey: string): boolean {
  if (!secretKey.trim()) return false;
  if (secretKey.startsWith("sk_test_xxx")) return false;
  if (secretKey === "sk_test_placeholder") return false;
  return true;
}

export class PayMongoClient {
  constructor(private secretKey: string) {}

  private authHeader(): string {
    const encoded = Buffer.from(`${this.secretKey}:`).toString("base64");
    return `Basic ${encoded}`;
  }

  private ensureLiveOrMock(operation: string): "live" | "mock" {
    if (isUsableSecret(this.secretKey)) return "live";
    assertIntegrationReady("paymongo", { operation });
    if (!allowIntegrationMocks()) {
      // assert should have thrown; belt-and-suspenders
      assertIntegrationReady("paymongo", { operation });
    }
    log.warn(`Using explicit PayMongo mock for ${operation} (credentials missing)`);
    return "mock";
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (this.ensureLiveOrMock("createPaymentIntent") === "mock") {
      return {
        id: `pi_mock_${Date.now()}`,
        clientKey: `pi_mock_${Date.now()}_client`,
        status: "awaiting_payment_method",
        amount: input.amountCentavos,
        mock: true,
      };
    }

    const res = await fetch(`${PAYMONGO_API}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: input.amountCentavos,
            currency: "PHP",
            payment_method_allowed: input.methods ?? ["gcash", "paymaya", "qrph", "card"],
            description: input.description,
            metadata: input.metadata,
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayMongo create intent failed: ${err}`);
    }

    const json = (await res.json()) as {
      data: { id: string; attributes: { client_key: string; status: string; amount: number } };
    };

    return {
      id: json.data.id,
      clientKey: json.data.attributes.client_key,
      status: json.data.attributes.status,
      amount: json.data.attributes.amount,
    };
  }

  async attachPaymentMethod(
    intentId: string,
    methodType: PayMongoMethod,
    clientKey: string
  ): Promise<AttachPaymentMethodResult> {
    if (intentId.startsWith("pi_mock_")) {
      if (!allowIntegrationMocks()) {
        throw new Error(
          "Refusing to attach a mock PayMongo intent outside mock-allowed runtimes."
        );
      }
      return {
        redirectUrl: `https://checkout.paymongo.com/mock?intent=${intentId}`,
        status: "awaiting_next_action",
        mock: true,
      };
    }

    this.ensureLiveOrMock("attachPaymentMethod");

    const res = await fetch(`${PAYMONGO_API}/payment_intents/${intentId}/attach`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            client_key: clientKey,
            payment_method: { type: methodType },
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`PayMongo attach failed: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      data: {
        attributes: {
          status: string;
          next_action?: { redirect?: { url?: string } };
        };
      };
    };

    return {
      redirectUrl: json.data.attributes.next_action?.redirect?.url,
      status: json.data.attributes.status,
    };
  }

  async createRefund(input: {
    paymentId: string;
    amountCentavos: number;
    reason?: "duplicate" | "fraudulent" | "requested_by_customer" | "others";
    notes?: string;
  }): Promise<{ id: string; status: string; mock?: boolean }> {
    if (input.paymentId.startsWith("pay_mock_") || !isUsableSecret(this.secretKey)) {
      if (this.ensureLiveOrMock("createRefund") === "mock") {
        return { id: `ref_mock_${Date.now()}`, status: "succeeded", mock: true };
      }
    }

    const res = await fetch(`${PAYMONGO_API}/refunds`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: input.amountCentavos,
            payment_id: input.paymentId,
            reason: input.reason ?? "requested_by_customer",
            notes: input.notes,
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`PayMongo refund failed: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      data: { id: string; attributes: { status: string } };
    };
    return { id: json.data.id, status: json.data.attributes.status };
  }

  verifyWebhookSignature(payload: string, signatureHeader: string, webhookSecret: string): boolean {
    // A missing secret must never mean "accept everything". Reject and force
    // the operator to configure PAYMONGO_WEBHOOK_SECRET.
    if (!webhookSecret) return false;

    const parts = signatureHeader.split(",").reduce(
      (acc, part) => {
        const [k, v] = part.split("=");
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      },
      {} as Record<string, string>
    );

    // PayMongo signs as `t=<timestamp>,te=<test-mode sig>,li=<live-mode sig>`.
    const timestamp = parts["t"];
    const signature = parts["li"] || parts["te"] || parts["v1"];
    if (!timestamp || !signature) return false;

    // Reject events older than 5 minutes to limit replay windows.
    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds)) return false;
    const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
    if (ageSeconds > 300) return false;

    const signed = `${timestamp}.${payload}`;
    const expected = createHmac("sha256", webhookSecret).update(signed).digest("hex");
    const expectedBuf = Buffer.from(expected, "hex");
    let providedBuf: Buffer;
    try {
      providedBuf = Buffer.from(signature, "hex");
    } catch {
      return false;
    }
    if (providedBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(expectedBuf, providedBuf);
  }
}

export function createPayMongoClient(): PayMongoClient {
  return new PayMongoClient(process.env.PAYMONGO_SECRET_KEY ?? "");
}
