import { createLalamoveClient, geocodeAddress } from "@guma-commerce/services";
import type { StorefrontStoreSettings } from "./storefront-settings";

export interface CheckoutDeliveryQuote {
  fee: number;
  etaMinutes?: number;
  quotationId: string;
  stopIds: { pickup: string; dropoff: string };
}

/**
 * Live Lalamove quote for a checkout. Returns null whenever a live quote
 * isn't possible (provider not Lalamove, no pickup address, geocoding or API
 * failure) so callers fall back to the seller's flat rate.
 */
export async function getLalamoveCheckoutQuote(
  settings: StorefrontStoreSettings,
  dropoffAddress: string
): Promise<CheckoutDeliveryQuote | null> {
  if (settings.delivery.provider !== "lalamove") return null;
  const pickupAddress = settings.delivery.pickupAddress.trim();
  if (!pickupAddress || dropoffAddress.trim().length < 10) return null;

  try {
    const [pickup, dropoff] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(dropoffAddress),
    ]);
    if (!pickup || !dropoff) return null;

    const lalamove = createLalamoveClient();
    const quote = await lalamove.getQuotation({
      pickup: { address: pickupAddress, coordinates: { lat: pickup.lat, lng: pickup.lng } },
      dropoff: {
        address: dropoffAddress,
        coordinates: { lat: dropoff.lat, lng: dropoff.lng },
      },
    });

    return {
      fee: quote.fee,
      etaMinutes: quote.etaMinutes,
      quotationId: quote.quotationId,
      stopIds: quote.stopIds,
    };
  } catch (error) {
    console.error("[delivery-quote] Lalamove quote failed:", error);
    return null;
  }
}
