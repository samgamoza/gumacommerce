import { createGrabClient, type GrabClient } from "../grab";
import {
  haversineKm,
  type DeliveryBooking,
  type DeliveryBookingRequest,
  type DeliveryProvider,
  type DeliveryQuote,
  type DeliveryQuoteRequest,
  type DeliveryWebhookUpdate,
} from "../provider";

export class GrabAdapter implements DeliveryProvider {
  readonly id = "grab" as const;
  readonly label = "GrabExpress";

  constructor(private client: GrabClient = createGrabClient()) {}

  isEnabled(): boolean {
    return true;
  }

  async isServiceable(request: DeliveryQuoteRequest): Promise<boolean> {
    return Boolean(request.pickup.coordinates && request.dropoff.coordinates);
  }

  async quote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    const { pickup, dropoff } = request;
    if (!pickup.coordinates || !dropoff.coordinates) {
      throw new Error("GrabExpress requires pickup and dropoff coordinates.");
    }

    const result = await this.client.getQuote({
      pickup: { address: pickup.address, coordinates: pickup.coordinates },
      dropoff: { address: dropoff.address, coordinates: dropoff.coordinates },
      serviceType: request.serviceType,
    });

    return {
      provider: this.id,
      quoteRef: result.quoteId,
      fee: result.fee,
      currency: result.currency,
      etaMinutes: result.etaMinutes,
      distanceKm: result.distanceKm ?? haversineKm(pickup.coordinates, dropoff.coordinates),
      expiresAt: result.expiresAt,
      meta: {
        serviceType: result.serviceType,
        pickup: { address: pickup.address, coordinates: pickup.coordinates },
        dropoff: { address: dropoff.address, coordinates: dropoff.coordinates },
      },
    };
  }

  async book(request: DeliveryBookingRequest): Promise<DeliveryBooking> {
    const meta = request.quote.meta as
      | {
          serviceType?: string;
          pickup?: { address: string; coordinates: { lat: string; lng: string } };
          dropoff?: { address: string; coordinates: { lat: string; lng: string } };
        }
      | undefined;

    if (!meta?.pickup || !meta.dropoff) {
      throw new Error("GrabExpress booking requires the stops captured on the quote.");
    }

    const booking = await this.client.book({
      quoteId: request.quote.quoteRef,
      serviceType: meta.serviceType ?? "INSTANT",
      pickup: meta.pickup,
      dropoff: meta.dropoff,
      recipientName: request.recipientName,
      recipientPhone: request.recipientPhone,
      senderName: request.senderName,
      senderPhone: request.senderPhone,
      remarks: request.remarks,
    });

    return {
      provider: this.id,
      providerOrderId: booking.deliveryId,
      status: booking.status,
      trackingUrl: booking.trackingUrl,
    };
  }

  parseWebhook(payload: unknown): DeliveryWebhookUpdate | null {
    const body = payload as
      | { deliveryID?: string; status?: string; trackingURL?: string }
      | undefined;
    if (!body?.deliveryID || !body.status) return null;

    return {
      providerOrderId: body.deliveryID,
      status: body.status,
      trackingUrl: body.trackingURL,
    };
  }
}
