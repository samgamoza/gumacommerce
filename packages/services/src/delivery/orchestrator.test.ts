import assert from "node:assert/strict";
import { test } from "node:test";
import {
  autoSelect,
  compareQuotes,
  createDeliveryProviders,
  dispatch,
  quoteAll,
} from "./orchestrator";
import type { DeliveryQuote, DeliveryQuoteRequest } from "./provider";

const MANILA: DeliveryQuoteRequest = {
  pickup: { address: "Makati", coordinates: { lat: "14.5547", lng: "121.0244" } },
  dropoff: { address: "Pasig", coordinates: { lat: "14.5764", lng: "121.0851" } },
};

function quote(partial: Partial<DeliveryQuote> & { provider: DeliveryQuote["provider"] }): DeliveryQuote {
  return {
    quoteRef: `${partial.provider}_ref`,
    fee: 100,
    currency: "PHP",
    ...partial,
  };
}

test("ranks the fastest quote first", () => {
  const slow = quote({ provider: "lalamove", etaMinutes: 45 });
  const fast = quote({ provider: "grab", etaMinutes: 20 });

  assert.equal([slow, fast].sort(compareQuotes)[0], fast);
});

test("a quote without an ETA (manual) always ranks last", () => {
  const manual = quote({ provider: "manual", fee: 0 });
  const courier = quote({ provider: "lalamove", etaMinutes: 90, fee: 500 });

  // Even though manual is free, the courier with a real ETA wins.
  assert.equal([manual, courier].sort(compareQuotes)[0], courier);
});

test("falls back to nearest, then cheapest, when ETAs tie", () => {
  const far = quote({ provider: "lalamove", etaMinutes: 30, distanceKm: 12 });
  const near = quote({ provider: "grab", etaMinutes: 30, distanceKm: 4 });
  assert.equal([far, near].sort(compareQuotes)[0], near);

  const pricey = quote({ provider: "lalamove", etaMinutes: 30, distanceKm: 5, fee: 200 });
  const cheap = quote({ provider: "grab", etaMinutes: 30, distanceKm: 5, fee: 80 });
  assert.equal([pricey, cheap].sort(compareQuotes)[0], cheap);
});

test("autoSelect picks the fastest and honours the in-house preference", () => {
  const fast = quote({ provider: "grab", etaMinutes: 20 });
  const inHouse = quote({ provider: "bayango", etaMinutes: 35 });

  assert.equal(autoSelect([fast, inHouse])?.provider, "grab");
  assert.equal(autoSelect([fast, inHouse], { preferInHouse: true })?.provider, "bayango");
  assert.equal(autoSelect([]), null);
});

test("BayanGo is never offered while it is an open hook", async () => {
  const ids = createDeliveryProviders().map((p) => p.id);
  assert.ok(!ids.includes("bayango"), "BayanGo must stay disabled until deployed");

  const attempts = await quoteAll(MANILA, { allow: ["bayango"] });
  assert.deepEqual(attempts, []);
});

test("quoteAll returns quotes from every serviceable courier", async () => {
  const attempts = await quoteAll(MANILA);
  const quoted = attempts.filter((a) => a.quote);

  assert.ok(quoted.length >= 2, "expected at least Lalamove + Grab to quote");
  assert.ok(quoted.some((a) => a.provider === "lalamove"));
  assert.ok(quoted.some((a) => a.provider === "grab"));
});

test("dispatch fails over to the next provider when a booking is rejected", async () => {
  // A Lalamove quote missing its stopIds meta cannot be booked, so booking it
  // throws and the orchestrator must fall through to manual.
  const broken = quote({ provider: "lalamove", etaMinutes: 5 });
  const manual = quote({ provider: "manual", fee: 0, meta: { manual: true } });

  const result = await dispatch({
    request: MANILA,
    recipientName: "Juan",
    recipientPhone: "+639171234567",
    quotes: [broken, manual],
  });

  assert.equal(result.booking.provider, "manual");
  assert.equal(result.failedOver.length, 1);
  assert.equal(result.failedOver[0]?.provider, "lalamove");
});

test("dispatch throws when nothing can be quoted", async () => {
  await assert.rejects(
    dispatch({
      request: MANILA,
      recipientName: "Juan",
      recipientPhone: "+639171234567",
      quotes: [],
    }),
    /No delivery provider could quote/
  );
});
