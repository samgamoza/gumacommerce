import { allowIntegrationMocks } from "../../config/integrations";
import { createLogger } from "../../logging";
import {
  BAYANGO_STATUS_TO_FULFILLMENT,
  createBayanGoClient,
  parseBayanGoWebhook,
  type BayanGoClient,
  type BayanGoStop,
} from "../bayango";
import {
  haversineKm,
  type DeliveryBooking,
  type DeliveryBookingRequest,
  type DeliveryProvider,
  type DeliveryQuote,
  type DeliveryQuoteRequest,
  type DeliveryStopInput,
  type DeliveryWebhookUpdate,
} from "../provider";

const log = createLogger("bayango-adapter");

/**
 * BayanGo — Guma's in-house delivery service, behind the shared provider contract.
 *
 * Talks to the BayanGo Partner API (docs/BAYANGO-PARTNER-API-CONTRACT.md).
 * Off unless BAYANGO_ENABLED=true AND the API is configured (or mocks are
 * allowed in this runtime). Preference over other couriers is the
 * orchestrator's `preferInHouse` policy (driven by BAYANGO_PREFERRED).
 */
export class BayanGoAdapter implements DeliveryProvider {
  readonly id = "bayango" as const;
  readonly label = "BayanGo";

  constructor(private client: BayanGoClient = createBayanGoClient()) {}

  isEnabled(): boolean {
    if (process.env.BAYANGO_ENABLED !== "true") return false;
    return this.client.configured() || allowIntegrationMocks();
  }

  async isServiceable(request: DeliveryQuoteRequest): Promise<boolean> {
    const pickup = toPoint(request.pickup);
    const dropoff = toPoint(request.dropoff);
    if (!pickup || !dropoff) return false; // BayanGo cannot geocode; we must send coordinates.
    try {
      return await this.client.serviceability(pickup, dropoff);
    } catch (error) {
      log.warn("BayanGo serviceability check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async quote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    const pickup = toStop(request.pickup);
    const dropoff = toStop(request.dropoff);
    if (!pickup || !dropoff) {
      throw new Error("BayanGo requires pickup and dropoff coordinates.");
    }
    const q = await this.client.quote({
      pickup,
      dropoff,
      vehicleType: request.serviceType?.toLowerCase(),
    });
    return {
      provider: this.id,
      quoteRef: q.quoteId,
      fee: q.fee,
      currency: q.currency,
      etaMinutes: q.etaMinutes,
      distanceKm:
        q.distanceKm ??
        haversineKm(request.pickup.coordinates!, request.dropoff.coordinates!),
      expiresAt: q.expiresAt,
      // Stops are replayed on book() — the partner API wants them again.
      meta: { pickup, dropoff },
    };
  }

  async book(request: DeliveryBookingRequest): Promise<DeliveryBooking> {
    const stops = request.quote.meta as
      | { pickup?: BayanGoStop; dropoff?: BayanGoStop }
      | undefined;
    if (!stops?.pickup || !stops?.dropoff) {
      throw new Error("BayanGo booking requires the stops captured at quote time.");
    }
    if (!request.externalRef) {
      throw new Error("BayanGo booking requires externalRef (the Guma order id).");
    }
    const booking = await this.client.book({
      quoteId: request.quote.quoteRef,
      externalRef: request.externalRef,
      merchant: request.merchant ?? {
        externalId: "unknown",
        name: request.senderName ?? "Guma Kart merchant",
        phone: request.senderPhone,
      },
      pickup: {
        ...stops.pickup,
        contactName: request.senderName,
        contactPhone: request.senderPhone,
      },
      dropoff: {
        ...stops.dropoff,
        recipientName: request.recipientName,
        recipientPhone: request.recipientPhone,
      },
      codAmount: request.codAmount,
      remarks: request.remarks,
    });
    return {
      provider: this.id,
      providerOrderId: booking.deliveryId,
      status: booking.status,
      trackingUrl: booking.trackingUrl,
    };
  }

  async cancel(providerOrderId: string): Promise<void> {
    await this.client.cancel(providerOrderId);
  }

  parseWebhook(payload: unknown): DeliveryWebhookUpdate | null {
    const event = parseBayanGoWebhook(payload);
    if (!event) return null;
    return {
      providerOrderId: event.delivery.deliveryId,
      status: event.delivery.status,
      trackingUrl: event.delivery.trackingUrl,
    };
  }

  /** Fulfillment state a partner status maps to, if any (contract §3.3). */
  static fulfillmentFor(status: string) {
    return BAYANGO_STATUS_TO_FULFILLMENT[status as keyof typeof BAYANGO_STATUS_TO_FULFILLMENT];
  }
}

function toPoint(stop: DeliveryStopInput): { lat: number; lng: number } | null {
  const lat = Number(stop.coordinates?.lat);
  const lng = Number(stop.coordinates?.lng);
  if (!stop.coordinates || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function toStop(stop: DeliveryStopInput): BayanGoStop | null {
  const point = toPoint(stop);
  return point ? { address: stop.address, ...point } : null;
}
