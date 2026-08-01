import { BayanGoAdapter } from "./adapters/bayango-adapter";
import { GrabAdapter } from "./adapters/grab-adapter";
import { LalamoveAdapter } from "./adapters/lalamove-adapter";
import { ManualAdapter } from "./adapters/manual-adapter";
import type {
  DeliveryBooking,
  DeliveryProvider,
  DeliveryProviderId,
  DeliveryQuote,
  DeliveryQuoteRequest,
} from "./provider";

export interface DeliveryPolicy {
  /** Restrict to these providers (tenant's allow-set). Empty/undefined = all. */
  allow?: DeliveryProviderId[];
  /** Prefer in-house BayanGo when it can service the route (once live). */
  preferInHouse?: boolean;
  /** Flat fee used by the manual/self-delivery fallback. */
  manualFlatFee?: number;
}

export interface QuoteAttempt {
  provider: DeliveryProviderId;
  quote?: DeliveryQuote;
  error?: string;
}

export interface DispatchResult {
  booking: DeliveryBooking;
  quote: DeliveryQuote;
  /** Providers tried and rejected before this one succeeded. */
  failedOver: Array<{ provider: DeliveryProviderId; error: string }>;
}

export function createDeliveryProviders(policy: DeliveryPolicy = {}): DeliveryProvider[] {
  const all: DeliveryProvider[] = [
    new LalamoveAdapter(),
    new GrabAdapter(),
    new BayanGoAdapter(),
    new ManualAdapter(policy.manualFlatFee ?? 0),
  ];

  const allow = policy.allow?.length ? new Set(policy.allow) : null;
  return all.filter((p) => p.isEnabled() && (!allow || allow.has(p.id)));
}

/**
 * Ranking: nearest and fastest first.
 *
 * A provider that returns an ETA always outranks one that does not (manual
 * self-delivery has no ETA, so it lands last and acts as the floor). Within
 * quotes that have an ETA we sort fastest → nearest → cheapest.
 */
export function compareQuotes(a: DeliveryQuote, b: DeliveryQuote): number {
  const aEta = a.etaMinutes;
  const bEta = b.etaMinutes;

  if (aEta != null && bEta == null) return -1;
  if (aEta == null && bEta != null) return 1;
  if (aEta != null && bEta != null && aEta !== bEta) return aEta - bEta;

  const aKm = a.distanceKm;
  const bKm = b.distanceKm;
  if (aKm != null && bKm == null) return -1;
  if (aKm == null && bKm != null) return 1;
  if (aKm != null && bKm != null && aKm !== bKm) return aKm - bKm;

  return a.fee - b.fee;
}

/** Quotes every eligible provider in parallel; failures are captured, not thrown. */
export async function quoteAll(
  request: DeliveryQuoteRequest,
  policy: DeliveryPolicy = {}
): Promise<QuoteAttempt[]> {
  const providers = createDeliveryProviders(policy);

  return Promise.all(
    providers.map(async (provider): Promise<QuoteAttempt> => {
      try {
        if (!(await provider.isServiceable(request))) {
          return { provider: provider.id, error: "Not serviceable for this route." };
        }
        return { provider: provider.id, quote: await provider.quote(request) };
      } catch (error) {
        return {
          provider: provider.id,
          error: error instanceof Error ? error.message : "Quote failed.",
        };
      }
    })
  );
}

/** Best quote by policy, or null when nothing quoted. */
export function autoSelect(
  quotes: DeliveryQuote[],
  policy: DeliveryPolicy = {}
): DeliveryQuote | null {
  if (!quotes.length) return null;

  const ranked = [...quotes].sort(compareQuotes);

  if (policy.preferInHouse) {
    const inHouse = ranked.find((q) => q.provider === "bayango");
    if (inHouse) return inHouse;
  }

  return ranked[0] ?? null;
}

export interface DispatchInput {
  request: DeliveryQuoteRequest;
  recipientName: string;
  recipientPhone: string;
  senderName?: string;
  senderPhone?: string;
  remarks?: string;
  /** Reuse quotes already shown at checkout instead of re-quoting. */
  quotes?: DeliveryQuote[];
}

/**
 * Books the best available provider, falling over to the next-best whenever a
 * booking is rejected, so a single courier outage can't strand an order.
 */
export async function dispatch(
  input: DispatchInput,
  policy: DeliveryPolicy = {}
): Promise<DispatchResult> {
  const available =
    input.quotes ??
    (await quoteAll(input.request, policy))
      .map((attempt) => attempt.quote)
      .filter((q): q is DeliveryQuote => Boolean(q));

  if (!available.length) {
    throw new Error("No delivery provider could quote this route.");
  }

  const ordered = [...available].sort(compareQuotes);
  if (policy.preferInHouse) {
    ordered.sort((a, b) =>
      a.provider === "bayango" ? -1 : b.provider === "bayango" ? 1 : 0
    );
  }

  const providers = new Map(createDeliveryProviders(policy).map((p) => [p.id, p]));
  const failedOver: Array<{ provider: DeliveryProviderId; error: string }> = [];

  for (const quote of ordered) {
    const provider = providers.get(quote.provider);
    if (!provider) continue;

    try {
      const booking = await provider.book({
        quote,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        senderName: input.senderName,
        senderPhone: input.senderPhone,
        remarks: input.remarks,
      });
      return { booking, quote, failedOver };
    } catch (error) {
      failedOver.push({
        provider: quote.provider,
        error: error instanceof Error ? error.message : "Booking failed.",
      });
    }
  }

  throw new Error(
    `All delivery providers failed: ${failedOver
      .map((f) => `${f.provider} (${f.error})`)
      .join(", ")}`
  );
}
