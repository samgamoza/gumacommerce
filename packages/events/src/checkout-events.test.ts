import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainEventSchema, EVENT_NAMES } from "./schemas";

describe("Checkout domain events", () => {
  it("registers Checkout.*.V1 and Order success events", () => {
    assert.equal(EVENT_NAMES.CHECKOUT_UPDATED, "Checkout.Updated.V1");
    assert.equal(EVENT_NAMES.CHECKOUT_PUBLISHED, "Checkout.Published.V1");
    assert.equal(EVENT_NAMES.CHECKOUT_ABANDONED, "Checkout.Abandoned.V1");
    assert.equal(EVENT_NAMES.ORDER_CREATED, "Order.Created.V1");
    assert.equal(EVENT_NAMES.ORDER_SUCCEEDED, "Order.Succeeded.V1");
  });

  it("accepts Checkout.Abandoned.V1 payloads", () => {
    const parsed = DomainEventSchema.parse({
      name: EVENT_NAMES.CHECKOUT_ABANDONED,
      tenantId: "11111111-1111-1111-1111-111111111111",
      data: {
        tenantId: "11111111-1111-1111-1111-111111111111",
        sessionId: "22222222-2222-2222-2222-222222222222",
        sessionKey: "abc12345",
        itemCount: 2,
      },
    });
    assert.equal(parsed.name, "Checkout.Abandoned.V1");
  });
});
