/**
 * Wire event persistence for storefront / webhook processes.
 */
import { persistDomainEvent } from "@gumakart/db";
import { registerEventPersistence } from "@gumakart/events";

let wired = false;

export function ensureEventsWired(): void {
  if (wired) return;
  registerEventPersistence(async (input) => {
    await persistDomainEvent(input);
  });
  wired = true;
}
