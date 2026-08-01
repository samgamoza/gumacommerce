/**
 * Delivery provider contract.
 *
 * Every courier (Lalamove, GrabExpress, in-house BayanGo, or plain manual
 * self-delivery) implements this one interface so the orchestrator can quote
 * them in parallel, auto-select the best, and fail over without knowing which
 * courier it is talking to.
 */

export type DeliveryProviderId = "lalamove" | "grab" | "manual" | "bayango";

export interface DeliveryLatLng {
  lat: string;
  lng: string;
}

export interface DeliveryStopInput {
  address: string;
  /** Optional — providers that need coordinates should geocode when absent. */
  coordinates?: DeliveryLatLng;
}

export interface DeliveryQuoteRequest {
  pickup: DeliveryStopInput;
  dropoff: DeliveryStopInput;
  /** Provider-specific vehicle/service hint (e.g. "MOTORCYCLE"). */
  serviceType?: string;
}

export interface DeliveryQuote {
  provider: DeliveryProviderId;
  /** Provider's own quotation id, replayed back on book(). */
  quoteRef: string;
  fee: number;
  currency: string;
  etaMinutes?: number;
  distanceKm?: number;
  expiresAt?: string;
  /**
   * Provider-specific payload the adapter needs at booking time
   * (e.g. Lalamove's pickup/dropoff stopIds). Opaque to the orchestrator.
   */
  meta?: Record<string, unknown>;
}

export interface DeliveryBookingRequest {
  quote: DeliveryQuote;
  recipientName: string;
  recipientPhone: string;
  senderName?: string;
  senderPhone?: string;
  remarks?: string;
}

export interface DeliveryBooking {
  provider: DeliveryProviderId;
  providerOrderId: string;
  status: string;
  trackingUrl?: string;
}

export interface DeliveryWebhookUpdate {
  providerOrderId: string;
  status: string;
  trackingUrl?: string;
}

export interface DeliveryProvider {
  readonly id: DeliveryProviderId;
  readonly label: string;

  /** Credentials/flags present — a disabled provider is never quoted. */
  isEnabled(): boolean;

  /**
   * Cheap pre-filter before spending a network call on a quote. Providers that
   * cannot answer this reliably should return true and let quote() fail.
   */
  isServiceable(request: DeliveryQuoteRequest): Promise<boolean>;

  quote(request: DeliveryQuoteRequest): Promise<DeliveryQuote>;

  book(request: DeliveryBookingRequest): Promise<DeliveryBooking>;

  cancel?(providerOrderId: string): Promise<void>;

  /** Normalizes a provider webhook body; return null when unrecognized. */
  parseWebhook?(payload: unknown): DeliveryWebhookUpdate | null;
}

const EARTH_RADIUS_KM = 6371;

/** Straight-line distance, used to rank "nearest" when a provider omits it. */
export function haversineKm(a: DeliveryLatLng, b: DeliveryLatLng): number | undefined {
  const lat1 = Number(a.lat);
  const lng1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lng2 = Number(b.lng);
  if ([lat1, lng1, lat2, lng2].some((n) => !Number.isFinite(n))) return undefined;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
