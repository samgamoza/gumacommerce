import { createHmac } from "crypto";

const SANDBOX_BASE = "https://rest.sandbox.lalamove.com/v3";
const PROD_BASE = "https://rest.lalamove.com/v3";

export interface LatLng {
  lat: string;
  lng: string;
}

export interface DeliveryStop {
  address: string;
  coordinates: LatLng;
}

export interface QuotationInput {
  pickup: DeliveryStop;
  dropoff: DeliveryStop;
  serviceType?: string;
}

export interface QuotationResult {
  quotationId: string;
  fee: number;
  currency: string;
  etaMinutes?: number;
  expiresAt: string;
  stopIds: { pickup: string; dropoff: string };
}

export interface BookDeliveryInput {
  quotationId: string;
  stopIds: { pickup: string; dropoff: string };
  recipientName: string;
  recipientPhone: string;
  senderName?: string;
  senderPhone?: string;
  remarks?: string;
}

export interface BookDeliveryResult {
  orderId: string;
  status: string;
  trackingUrl?: string;
}

export class LalamoveClient {
  private baseUrl: string;

  constructor(
    private apiKey: string,
    private apiSecret: string,
    env: "sandbox" | "production" = "sandbox"
  ) {
    this.baseUrl = env === "production" ? PROD_BASE : SANDBOX_BASE;
  }

  private sign(method: string, path: string, body: string, timestamp: string): string {
    const raw = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
    return createHmac("sha256", this.apiSecret).update(raw).digest("hex");
  }

  private headers(method: string, path: string, body: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.sign(method, path, body, timestamp);
    const token = `${this.apiKey}:${timestamp}:${signature}`;

    return {
      Authorization: `hmac ${token}`,
      "Content-Type": "application/json",
      Market: "PH",
    };
  }

  async getQuotation(input: QuotationInput): Promise<QuotationResult> {
    if (!this.apiKey) {
      return {
        quotationId: `quote_mock_${Date.now()}`,
        fee: 89,
        currency: "PHP",
        etaMinutes: 35,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        stopIds: { pickup: "stop_pickup_mock", dropoff: "stop_dropoff_mock" },
      };
    }

    const path = "/v3/quotations";
    const body = JSON.stringify({
      data: {
        serviceType: input.serviceType ?? "MOTORCYCLE",
        stops: [
          { coordinates: input.pickup.coordinates, address: input.pickup.address },
          { coordinates: input.dropoff.coordinates, address: input.dropoff.address },
        ],
        language: "en_PH",
      },
    });

    const res = await fetch(`${this.baseUrl}${path.replace("/v3", "")}`, {
      method: "POST",
      headers: this.headers("POST", path, body),
      body,
    });

    if (!res.ok) {
      throw new Error(`Lalamove quotation failed: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      data: {
        quotationId: string;
        priceBreakdown: { total: string };
        stops: Array<{ stopId: string }>;
        expiresAt: string;
      };
    };

    return {
      quotationId: json.data.quotationId,
      fee: parseFloat(json.data.priceBreakdown.total),
      currency: "PHP",
      expiresAt: json.data.expiresAt,
      stopIds: {
        pickup: json.data.stops[0]?.stopId ?? "",
        dropoff: json.data.stops[1]?.stopId ?? "",
      },
    };
  }

  async bookDelivery(input: BookDeliveryInput): Promise<BookDeliveryResult> {
    if (input.quotationId.startsWith("quote_mock_")) {
      return {
        orderId: `lalamove_mock_${Date.now()}`,
        status: "ASSIGNING_DRIVER",
        trackingUrl: "https://share.lalamove.com/mock",
      };
    }

    const path = "/v3/orders";
    const body = JSON.stringify({
      data: {
        quotationId: input.quotationId,
        sender: {
          stopId: input.stopIds.pickup,
          name: input.senderName ?? "Seller",
          phone: input.senderPhone ?? "+639000000000",
        },
        recipients: [
          {
            stopId: input.stopIds.dropoff,
            name: input.recipientName,
            phone: input.recipientPhone,
            remarks: input.remarks,
          },
        ],
      },
    });

    const res = await fetch(`${this.baseUrl}${path.replace("/v3", "")}`, {
      method: "POST",
      headers: this.headers("POST", path, body),
      body,
    });

    if (!res.ok) {
      throw new Error(`Lalamove book failed: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      data: { orderId: string; status: string; shareLink?: string };
    };

    return {
      orderId: json.data.orderId,
      status: json.data.status,
      trackingUrl: json.data.shareLink,
    };
  }
}

export function createLalamoveClient(): LalamoveClient {
  const env = (process.env.LALAMOVE_ENV ?? "sandbox") as "sandbox" | "production";
  return new LalamoveClient(
    process.env.LALAMOVE_API_KEY ?? "",
    process.env.LALAMOVE_API_SECRET ?? "",
    env
  );
}
