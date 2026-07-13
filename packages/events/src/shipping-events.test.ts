import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainEventSchema, EVENT_NAMES } from "./schemas";

describe("Shipping domain events", () => {
  it("registers Shipping.*.V1 names", () => {
    assert.equal(EVENT_NAMES.SHIPPING_UPDATED, "Shipping.Updated.V1");
    assert.equal(EVENT_NAMES.SHIPPING_PUBLISHED, "Shipping.Published.V1");
    assert.equal(EVENT_NAMES.SHIPPING_PROFILE_CREATED, "Shipping.ProfileCreated.V1");
    assert.equal(EVENT_NAMES.SHIPPING_RULE_CHANGED, "Shipping.RuleChanged.V1");
  });

  it("accepts Shipping.Published.V1 payloads", () => {
    const parsed = DomainEventSchema.parse({
      name: EVENT_NAMES.SHIPPING_PUBLISHED,
      tenantId: "11111111-1111-1111-1111-111111111111",
      data: {
        tenantId: "11111111-1111-1111-1111-111111111111",
        changeRequestId: "22222222-2222-2222-2222-222222222222",
        defaultProfileId: "default",
      },
    });
    assert.equal(parsed.name, "Shipping.Published.V1");
  });
});
