import {
  haversineKm,
  type DeliveryBooking,
  type DeliveryBookingRequest,
  type DeliveryProvider,
  type DeliveryQuote,
  type DeliveryQuoteRequest,
} from "../provider";

/**
 * Seller delivers it themselves (own rider, meetup, or courier booked offline).
 * Always available, so it is the guaranteed floor when every external courier
 * fails to quote — the order can still be placed.
 *
 * The fee comes from the tenant's own flat/base rate rather than an API.
 */
export class ManualAdapter implements DeliveryProvider {
  readonly id = "manual" as const;
  readonly label = "Seller delivery";

  constructor(private flatFee = 0) {}

  isEnabled(): boolean {
    return true;
  }

  async isServiceable(): Promise<boolean> {
    return true;
  }

  async quote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    const { pickup, dropoff } = request;
    const distanceKm =
      pickup.coordinates && dropoff.coordinates
        ? haversineKm(pickup.coordinates, dropoff.coordinates)
        : undefined;

    return {
      provider: this.id,
      quoteRef: `manual_${Date.now()}`,
      fee: this.flatFee,
      currency: "PHP",
      distanceKm,
      // No ETA — ranking treats manual as last resort (see orchestrator).
      meta: { manual: true },
    };
  }

  async book(request: DeliveryBookingRequest): Promise<DeliveryBooking> {
    // Nothing to call — the seller arranges it. We still record a booking row
    // so the order has a consistent delivery lifecycle.
    return {
      provider: this.id,
      providerOrderId: request.quote.quoteRef,
      status: "PENDING_SELLER_DISPATCH",
    };
  }
}
