import {
  autoSelect,
  geocodeAddress,
  quoteAll,
  type DeliveryProviderId,
  type DeliveryQuote,
} from "@guma-commerce/services";
import type { StorefrontStoreSettings } from "./storefront-settings";

export interface CheckoutDeliveryQuote {
  fee: number;
  etaMinutes?: number;
  provider: "lalamove" | "grab";
  quotationId: string;
  /** Opaque booking meta (e.g. Lalamove stopIds). */
  meta?: Record<string, unknown>;
}

function preferredLiveProviders(
  preferred: StorefrontStoreSettings["delivery"]["provider"]
): DeliveryProviderId[] {
  if (preferred === "grab") return ["grab", "lalamove"];
  if (preferred === "lalamove") return ["lalamove", "grab"];
  return [];
}

/**
 * Live courier quote for checkout. Tries the seller's preferred app first,
 * then the other connected courier. Returns null so callers fall back to flat rate.
 */
export async function getCheckoutDeliveryQuote(
  settings: StorefrontStoreSettings,
  dropoffAddress: string
): Promise<CheckoutDeliveryQuote | null> {
  const preferred = settings.delivery.provider;
  const allow = preferredLiveProviders(preferred);
  if (!allow.length) return null;

  const pickupAddress = settings.delivery.pickupAddress.trim();
  if (!pickupAddress || dropoffAddress.trim().length < 10) return null;

  try {
    const [pickup, dropoff] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(dropoffAddress),
    ]);
    if (!pickup || !dropoff) return null;

    const request = {
      pickup: {
        address: pickupAddress,
        coordinates: { lat: String(pickup.lat), lng: String(pickup.lng) },
      },
      dropoff: {
        address: dropoffAddress,
        coordinates: { lat: String(dropoff.lat), lng: String(dropoff.lng) },
      },
    };

    const attempts = await quoteAll(request, { allow });
    const quotes = attempts
      .map((a) => a.quote)
      .filter((q): q is DeliveryQuote => {
        if (!q) return false;
        return q.provider === "lalamove" || q.provider === "grab";
      });

    if (!quotes.length) return null;

    const preferredQuote = quotes.find((q) => q.provider === preferred);
    const selected = preferredQuote ?? autoSelect(quotes);
    if (!selected || (selected.provider !== "lalamove" && selected.provider !== "grab")) {
      return null;
    }

    return {
      fee: selected.fee,
      etaMinutes: selected.etaMinutes,
      provider: selected.provider,
      quotationId: selected.quoteRef,
      meta: selected.meta,
    };
  } catch (error) {
    console.error("[delivery-quote] Live courier quote failed:", error);
    return null;
  }
}

/** @deprecated Use getCheckoutDeliveryQuote — kept for any leftover imports. */
export const getLalamoveCheckoutQuote = getCheckoutDeliveryQuote;
