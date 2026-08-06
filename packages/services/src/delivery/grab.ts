/**
 * GrabExpress (Grab Partner API) client.
 *
 * Auth is OAuth2 client-credentials against GrabID, then quote/create against
 * the deliveries API. Mock mode is allowed only in non-production runtimes
 * (see allowIntegrationMocks); production missing credentials fail clearly.
 *
 * NOTE: endpoint paths and payload shapes follow Grab's partner deliveries API;
 * verify against the partner docs tied to your merchant account before enabling
 * in production (set GRAB_ENV=production).
 */

import {
  assertIntegrationReady,
  allowIntegrationMocks,
} from "../config/integrations";
import { createLogger } from "../logging";

const SANDBOX_BASE = "https://partner-api.stg-myteksi.com";
const PROD_BASE = "https://partner-api.grab.com";
const OAUTH_PATH = "/grabid/v1/oauth2/token";
const OAUTH_SCOPE = "grab_express.partner_deliveries";
const log = createLogger("grab");

export interface GrabLatLng {
  lat: string;
  lng: string;
}

export interface GrabStop {
  address: string;
  coordinates: GrabLatLng;
}

export interface GrabQuoteInput {
  pickup: GrabStop;
  dropoff: GrabStop;
  serviceType?: string;
}

export interface GrabQuoteResult {
  quoteId: string;
  fee: number;
  currency: string;
  etaMinutes?: number;
  distanceKm?: number;
  expiresAt?: string;
  serviceType: string;
  mock?: boolean;
}

export interface GrabBookInput {
  quoteId: string;
  serviceType: string;
  pickup: GrabStop;
  dropoff: GrabStop;
  recipientName: string;
  recipientPhone: string;
  senderName?: string;
  senderPhone?: string;
  remarks?: string;
}

export interface GrabBookResult {
  deliveryId: string;
  status: string;
  trackingUrl?: string;
  mock?: boolean;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class GrabClient {
  private baseUrl: string;
  private cachedToken: CachedToken | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string,
    env: "sandbox" | "production" = "sandbox"
  ) {
    this.baseUrl = env === "production" ? PROD_BASE : SANDBOX_BASE;
  }

  get configured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private async accessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 30_000) {
      return this.cachedToken.token;
    }

    const res = await fetch(`${this.baseUrl}${OAUTH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
        scope: OAUTH_SCOPE,
      }),
    });

    if (!res.ok) {
      throw new Error(`Grab auth failed: ${await res.text()}`);
    }

    const json = (await res.json()) as { access_token: string; expires_in?: number };
    this.cachedToken = {
      token: json.access_token,
      expiresAt: now + (json.expires_in ?? 3600) * 1000,
    };
    return this.cachedToken.token;
  }

  private async authedFetch(path: string, body: unknown): Promise<Response> {
    const token = await this.accessToken();
    return fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async getQuote(input: GrabQuoteInput): Promise<GrabQuoteResult> {
    const serviceType = input.serviceType ?? "INSTANT";

    if (!this.configured) {
      assertIntegrationReady("grab", { operation: "getQuote" });
      log.warn("Using explicit Grab mock for getQuote (credentials missing)");
      return {
        quoteId: `grab_quote_mock_${Date.now()}`,
        fee: 95,
        currency: "PHP",
        etaMinutes: 40,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        serviceType,
        mock: true,
      };
    }

    const res = await this.authedFetch("/v1/deliveries/quotes", {
      serviceType,
      packages: [{ name: "Order", quantity: 1 }],
      origin: {
        address: input.pickup.address,
        coordinates: {
          latitude: Number(input.pickup.coordinates.lat),
          longitude: Number(input.pickup.coordinates.lng),
        },
      },
      destination: {
        address: input.dropoff.address,
        coordinates: {
          latitude: Number(input.dropoff.coordinates.lat),
          longitude: Number(input.dropoff.coordinates.lng),
        },
      },
    });

    if (!res.ok) {
      throw new Error(`Grab quote failed: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      quotes?: Array<{
        quoteId?: string;
        service?: { type?: string };
        amount?: number;
        currency?: { code?: string };
        estimatedTimeline?: { completed?: string };
        distance?: number;
      }>;
    };

    const best = json.quotes?.[0];
    if (!best?.quoteId) {
      throw new Error("Grab returned no quotes for this route.");
    }

    return {
      quoteId: best.quoteId,
      fee: Number(best.amount ?? 0),
      currency: best.currency?.code ?? "PHP",
      // Grab returns an ISO completion estimate; convert to minutes from now.
      etaMinutes: best.estimatedTimeline?.completed
        ? Math.max(
            0,
            Math.round(
              (new Date(best.estimatedTimeline.completed).getTime() - Date.now()) / 60000
            )
          )
        : undefined,
      distanceKm: typeof best.distance === "number" ? best.distance / 1000 : undefined,
      serviceType: best.service?.type ?? serviceType,
    };
  }

  async book(input: GrabBookInput): Promise<GrabBookResult> {
    if (input.quoteId.startsWith("grab_quote_mock_")) {
      if (!allowIntegrationMocks()) {
        throw new Error(
          "Refusing to book a mock Grab quotation outside mock-allowed runtimes. Configure GRAB_CLIENT_ID and GRAB_CLIENT_SECRET."
        );
      }
      log.warn("Booking mock Grab delivery (explicit mock quotation)");
      return {
        deliveryId: `grab_mock_${Date.now()}`,
        status: "ALLOCATING",
        trackingUrl: "https://grab.com/track/mock",
        mock: true,
      };
    }

    const res = await this.authedFetch("/v1/deliveries", {
      merchantOrderID: input.remarks?.slice(0, 64) ?? undefined,
      serviceType: input.serviceType,
      packages: [{ name: "Order", quantity: 1, description: input.remarks }],
      origin: {
        address: input.pickup.address,
        coordinates: {
          latitude: Number(input.pickup.coordinates.lat),
          longitude: Number(input.pickup.coordinates.lng),
        },
      },
      destination: {
        address: input.dropoff.address,
        coordinates: {
          latitude: Number(input.dropoff.coordinates.lat),
          longitude: Number(input.dropoff.coordinates.lng),
        },
      },
      sender: {
        firstName: input.senderName ?? "Seller",
        phone: input.senderPhone ?? "+639000000000",
      },
      recipient: {
        firstName: input.recipientName,
        phone: input.recipientPhone,
      },
    });

    if (!res.ok) {
      throw new Error(`Grab book failed: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      deliveryID?: string;
      status?: string;
      trackingURL?: string;
    };

    if (!json.deliveryID) {
      throw new Error("Grab booking returned no deliveryID.");
    }

    return {
      deliveryId: json.deliveryID,
      status: json.status ?? "ALLOCATING",
      trackingUrl: json.trackingURL,
    };
  }
}

export function createGrabClient(): GrabClient {
  const env = (process.env.GRAB_ENV ?? "sandbox") as "sandbox" | "production";
  return new GrabClient(
    process.env.GRAB_CLIENT_ID ?? "",
    process.env.GRAB_CLIENT_SECRET ?? "",
    env
  );
}
