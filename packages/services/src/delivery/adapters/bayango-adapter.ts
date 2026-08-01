import {
  type DeliveryBooking,
  type DeliveryProvider,
  type DeliveryQuote,
  type DeliveryQuoteRequest,
} from "../provider";

/**
 * BayanGo — Guma's in-house delivery service.
 *
 * OPEN HOOK ONLY. BayanGo is still in final development and is not deployed, so
 * this adapter is deliberately inert: `isEnabled()` is gated on
 * BAYANGO_ENABLED, and `isServiceable()` returns false, which means the
 * orchestrator will never quote or select it.
 *
 * When BayanGo ships:
 *   1. implement quote()/book() against its API (or internal dispatch table),
 *   2. add "bayango" to the `delivery_provider` pg enum + a migration,
 *   3. set BAYANGO_ENABLED=true and give it preference in the ranking policy
 *      for areas it services.
 * No orchestrator changes are required.
 */
export class BayanGoAdapter implements DeliveryProvider {
  readonly id = "bayango" as const;
  readonly label = "BayanGo";

  isEnabled(): boolean {
    return process.env.BAYANGO_ENABLED === "true";
  }

  async isServiceable(_request: DeliveryQuoteRequest): Promise<boolean> {
    // Not deployed yet — never serviceable, so never selected.
    return false;
  }

  async quote(_request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    throw new Error("BayanGo is not available yet.");
  }

  async book(): Promise<DeliveryBooking> {
    throw new Error("BayanGo is not available yet.");
  }
}
