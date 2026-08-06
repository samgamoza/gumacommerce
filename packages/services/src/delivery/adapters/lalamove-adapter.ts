import { createLalamoveClient, type LalamoveClient } from "../lalamove";
import { allowIntegrationMocks } from "../../config/integrations";
import {
  haversineKm,
  type DeliveryBooking,
  type DeliveryBookingRequest,
  type DeliveryProvider,
  type DeliveryQuote,
  type DeliveryQuoteRequest,
  type DeliveryWebhookUpdate,
} from "../provider";

/**
 * Wraps the existing LalamoveClient in the shared provider contract.
 * Enabled when credentials exist, or when explicit mocks are allowed.
 */
export class LalamoveAdapter implements DeliveryProvider {
  readonly id = "lalamove" as const;
  readonly label = "Lalamove";

  constructor(private client: LalamoveClient = createLalamoveClient()) {}

  isEnabled(): boolean {
    const hasKeys = Boolean(
      process.env.LALAMOVE_API_KEY?.trim() && process.env.LALAMOVE_API_SECRET?.trim()
    );
    return hasKeys || allowIntegrationMocks();
  }

  async isServiceable(request: DeliveryQuoteRequest): Promise<boolean> {
    return Boolean(request.pickup.coordinates && request.dropoff.coordinates);
  }

  async quote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    const { pickup, dropoff } = request;
    if (!pickup.coordinates || !dropoff.coordinates) {
      throw new Error("Lalamove requires pickup and dropoff coordinates.");
    }

    const result = await this.client.getQuotation({
      pickup: { address: pickup.address, coordinates: pickup.coordinates },
      dropoff: { address: dropoff.address, coordinates: dropoff.coordinates },
      serviceType: request.serviceType,
    });

    return {
      provider: this.id,
      quoteRef: result.quotationId,
      fee: result.fee,
      currency: result.currency,
      etaMinutes: result.etaMinutes,
      distanceKm: haversineKm(pickup.coordinates, dropoff.coordinates),
      expiresAt: result.expiresAt,
      meta: { stopIds: result.stopIds },
    };
  }

  async book(request: DeliveryBookingRequest): Promise<DeliveryBooking> {
    const stopIds = request.quote.meta?.stopIds as
      | { pickup: string; dropoff: string }
      | undefined;
    if (!stopIds) {
      throw new Error("Lalamove booking requires stopIds from the quote.");
    }

    const booking = await this.client.bookDelivery({
      quotationId: request.quote.quoteRef,
      stopIds,
      recipientName: request.recipientName,
      recipientPhone: request.recipientPhone,
      senderName: request.senderName,
      senderPhone: request.senderPhone,
      remarks: request.remarks,
    });

    return {
      provider: this.id,
      providerOrderId: booking.orderId,
      status: booking.status,
      trackingUrl: booking.trackingUrl,
    };
  }

  parseWebhook(payload: unknown): DeliveryWebhookUpdate | null {
    const body = payload as
      | { data?: { order?: { orderId?: string; status?: string; shareLink?: string } } }
      | undefined;
    const order = body?.data?.order;
    if (!order?.orderId || !order.status) return null;

    return {
      providerOrderId: order.orderId,
      status: order.status,
      trackingUrl: order.shareLink,
    };
  }
}
