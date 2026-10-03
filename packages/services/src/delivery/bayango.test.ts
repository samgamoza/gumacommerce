import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, test } from "node:test";
import {
  BAYANGO_STATUS_TO_FULFILLMENT,
  BayanGoApiError,
  BayanGoClient,
  normalizeBayanGoStatus,
  parseBayanGoWebhook,
  verifyBayanGoWebhook,
} from "./bayango";
import { BayanGoAdapter } from "./adapters/bayango-adapter";
import type { DeliveryQuoteRequest } from "./provider";

/*
  These tests encode docs/BAYANGO-PARTNER-API-CONTRACT.md. If BayanGo changes
  the wire format, this file and the contract doc change together.
*/

const ROUTE: DeliveryQuoteRequest = {
  pickup: { address: "Rizal Ave, Puerto Princesa", coordinates: { lat: "9.7392", lng: "118.7353" } },
  dropoff: { address: "Malvar St, Puerto Princesa", coordinates: { lat: "9.75", lng: "118.74" } },
};

type Call = { url: string; init: RequestInit };

function fakeFetch(responses: Array<{ status?: number; body: unknown }>) {
  const calls: Call[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift() ?? { status: 500, body: { error: { message: "no more" } } };
    return new Response(JSON.stringify(next.body), {
      status: next.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { impl, calls };
}

const ENV_KEYS = ["BAYANGO_ENABLED", "BAYANGO_API_BASE_URL", "BAYANGO_API_KEY", "APP_ENV", "NODE_ENV"];
const savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

test("quote sends coordinates as numbers and converts centavos to pesos", async () => {
  const { impl, calls } = fakeFetch([
    { body: { quoteId: "qt_1", feeCents: 8950, currency: "PHP", etaMinutes: 30, distanceKm: 2.4, expiresAt: "2026-10-02T08:30:00Z" } },
  ]);
  const client = new BayanGoClient({ baseUrl: "https://bg.test/partner/v1/", apiKey: "k_live", fetchImpl: impl });
  const q = await client.quote({
    pickup: { address: "A", lat: 9.7392, lng: 118.7353 },
    dropoff: { address: "B", lat: 9.75, lng: 118.74 },
  });

  assert.equal(q.fee, 89.5);
  assert.equal(q.quoteId, "qt_1");
  assert.equal(calls[0]!.url, "https://bg.test/partner/v1/quotes");
  const headers = calls[0]!.init.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer k_live");
  const sent = JSON.parse(String(calls[0]!.init.body));
  assert.equal(typeof sent.pickup.lat, "number");
  assert.equal(sent.vehicleType, "motorcycle");
});

test("book is idempotent on the Guma order id and sends COD in centavos", async () => {
  const { impl, calls } = fakeFetch([
    { status: 201, body: { deliveryId: "dlv_1", status: "pending", feeCents: 8900, trackingUrl: "https://t/dlv_1" } },
  ]);
  const client = new BayanGoClient({ baseUrl: "https://bg.test/v1", apiKey: "k", fetchImpl: impl });
  const b = await client.book({
    quoteId: "qt_1",
    externalRef: "order-uuid-1",
    merchant: { externalId: "tenant-1", name: "Tita Bea" },
    pickup: { address: "A", lat: 1, lng: 2 },
    dropoff: { address: "B", lat: 3, lng: 4, recipientName: "Marites", recipientPhone: "+639181112222" },
    codAmount: 1250,
  });

  assert.equal(b.deliveryId, "dlv_1");
  assert.equal(b.status, "pending");
  assert.equal(b.fee, 89);
  const headers = calls[0]!.init.headers as Record<string, string>;
  assert.equal(headers["Idempotency-Key"], "order-uuid-1");
  const sent = JSON.parse(String(calls[0]!.init.body));
  assert.deepEqual(sent.payment, { type: "cod", codAmountCents: 125000 });
  assert.equal(sent.externalRef, "order-uuid-1");
});

test("prepaid bookings never send a COD amount", async () => {
  const { impl, calls } = fakeFetch([{ body: { deliveryId: "dlv_2", status: "pending" } }]);
  const client = new BayanGoClient({ baseUrl: "https://bg.test/v1", apiKey: "k", fetchImpl: impl });
  await client.book({
    quoteId: "qt_2",
    externalRef: "order-2",
    merchant: { externalId: "t", name: "n" },
    pickup: { address: "A", lat: 1, lng: 2 },
    dropoff: { address: "B", lat: 3, lng: 4, recipientName: "R", recipientPhone: "+639" },
  });
  assert.deepEqual(JSON.parse(String(calls[0]!.init.body)).payment, { type: "prepaid" });
});

test("API errors surface the contract error code", async () => {
  const { impl } = fakeFetch([
    { status: 422, body: { error: { code: "quote_expired", message: "Quote expired" } } },
  ]);
  const client = new BayanGoClient({ baseUrl: "https://bg.test/v1", apiKey: "k", fetchImpl: impl });
  await assert.rejects(
    () =>
      client.book({
        quoteId: "old",
        externalRef: "o",
        merchant: { externalId: "t", name: "n" },
        pickup: { address: "A", lat: 1, lng: 2 },
        dropoff: { address: "B", lat: 3, lng: 4, recipientName: "R", recipientPhone: "p" },
      }),
    (err: unknown) => err instanceof BayanGoApiError && err.status === 422 && err.code === "quote_expired"
  );
});

test("unconfigured client refuses in production instead of mocking", async () => {
  process.env.NODE_ENV = "production";
  process.env.APP_ENV = "production";
  const client = new BayanGoClient({ baseUrl: "", apiKey: "" });
  await assert.rejects(() => client.quote({ pickup: { address: "A", lat: 1, lng: 2 }, dropoff: { address: "B", lat: 3, lng: 4 } }));
});

test("adapter stays off until BAYANGO_ENABLED=true", () => {
  delete process.env.BAYANGO_ENABLED;
  const adapter = new BayanGoAdapter(new BayanGoClient({ baseUrl: "https://bg.test", apiKey: "k" }));
  assert.equal(adapter.isEnabled(), false);
  process.env.BAYANGO_ENABLED = "true";
  assert.equal(adapter.isEnabled(), true);
});

test("adapter is not serviceable without coordinates and swallows API failures", async () => {
  const { impl } = fakeFetch([{ status: 503, body: { error: { message: "down" } } }]);
  const adapter = new BayanGoAdapter(new BayanGoClient({ baseUrl: "https://bg.test", apiKey: "k", fetchImpl: impl }));
  assert.equal(
    await adapter.isServiceable({ pickup: { address: "A" }, dropoff: { address: "B" } }),
    false
  );
  assert.equal(await adapter.isServiceable(ROUTE), false);
});

test("adapter quote → book replays the stops and requires the order id", async () => {
  const { impl, calls } = fakeFetch([
    { body: { quoteId: "qt_9", feeCents: 7900, etaMinutes: 40 } },
    { body: { deliveryId: "dlv_9", status: "pending", trackingUrl: "https://t/9" } },
  ]);
  const adapter = new BayanGoAdapter(new BayanGoClient({ baseUrl: "https://bg.test", apiKey: "k", fetchImpl: impl }));
  const quote = await adapter.quote(ROUTE);
  assert.equal(quote.provider, "bayango");
  assert.equal(quote.fee, 79);
  assert.ok(quote.distanceKm && quote.distanceKm > 0, "falls back to haversine distance");

  await assert.rejects(() =>
    adapter.book({ quote, recipientName: "R", recipientPhone: "+639" })
  );

  const booking = await adapter.book({
    quote,
    recipientName: "Marites",
    recipientPhone: "+639181112222",
    externalRef: "order-9",
    merchant: { externalId: "tenant-9", name: "Shop" },
  });
  assert.equal(booking.providerOrderId, "dlv_9");
  const sent = JSON.parse(String(calls[1]!.init.body));
  assert.equal(sent.pickup.lat, 9.7392);
  assert.equal(sent.dropoff.recipientName, "Marites");
});

test("webhook signature: valid, tampered, stale", () => {
  const secret = "whsec_test";
  const rawBody = JSON.stringify({ hello: "world" });
  const ts = 1_790_924_065;
  const sig = createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest("hex");

  assert.equal(verifyBayanGoWebhook({ rawBody, signature: sig, timestamp: String(ts), secret, nowSeconds: ts + 10 }), true);
  assert.equal(verifyBayanGoWebhook({ rawBody: rawBody + " ", signature: sig, timestamp: String(ts), secret, nowSeconds: ts }), false);
  assert.equal(verifyBayanGoWebhook({ rawBody, signature: sig, timestamp: String(ts), secret, nowSeconds: ts + 301 }), false);
  assert.equal(verifyBayanGoWebhook({ rawBody, signature: null, timestamp: String(ts), secret }), false);
  assert.equal(verifyBayanGoWebhook({ rawBody, signature: sig, timestamp: String(ts), secret: "" }), false);
});

test("webhook parsing follows the contract and rejects unknown statuses", () => {
  const event = parseBayanGoWebhook({
    eventId: "evt_1",
    type: "delivery.status_changed",
    delivery: {
      deliveryId: "dlv_1",
      externalRef: "order-1",
      status: "PICKED_UP",
      rider: { name: "Jun", phone: "+639190000000", plateNumber: "ABC 1234" },
      location: { lat: "9.741", lng: 118.736 },
    },
  });
  assert.ok(event);
  assert.equal(event!.delivery.status, "picked_up");
  assert.deepEqual(event!.delivery.location, { lat: 9.741, lng: 118.736, at: undefined });
  assert.equal(event!.delivery.rider?.plateNumber, "ABC 1234");

  assert.equal(parseBayanGoWebhook({ eventId: "e", type: "delivery.status_changed", delivery: { deliveryId: "d", status: "en_route" } }), null);
  assert.equal(parseBayanGoWebhook({ type: "delivery.status_changed", delivery: { deliveryId: "d", status: "delivered" } }), null);
  assert.equal(normalizeBayanGoStatus("Failed_Delivery"), "failed_delivery");
});

test("partner statuses map 1:1 onto fulfillment; a cancel is never an order cancel", () => {
  assert.equal(BAYANGO_STATUS_TO_FULFILLMENT.assigned, "booked");
  assert.equal(BAYANGO_STATUS_TO_FULFILLMENT.picked_up, "picked_up");
  assert.equal(BAYANGO_STATUS_TO_FULFILLMENT.in_transit, "out_for_delivery");
  assert.equal(BAYANGO_STATUS_TO_FULFILLMENT.delivered, "delivered");
  assert.equal(BAYANGO_STATUS_TO_FULFILLMENT.failed_delivery, "failed_delivery");
  assert.equal(BAYANGO_STATUS_TO_FULFILLMENT.returned, "returned");
  assert.equal(BAYANGO_STATUS_TO_FULFILLMENT.cancelled, "booking_cancelled");
});
