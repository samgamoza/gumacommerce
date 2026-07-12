/**
 * Wire event persistence for storefront / webhook processes.
 */
import { persistDomainEvent } from "@guma-commerce/db";
import { registerEventPersistence } from "@guma-commerce/events";

let wired = false;

export function ensureEventsWired(): void {
  if (wired) return;
  registerEventPersistence(async (input) => {
    await persistDomainEvent(input);
  });
  wired = true;
}
