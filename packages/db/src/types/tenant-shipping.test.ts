import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  legacyDeliveryFromShipping,
  normalizeShippingJson,
  resolveShippingFee,
  shippingFromLegacyDelivery,
} from "./tenant-shipping";

describe("shippingFromLegacyDelivery", () => {
  it("maps flat rate provider into default profile methods", () => {
    const shipping = shippingFromLegacyDelivery({
      provider: "manual",
      flatRate: 120,
      freeDeliveryMin: 600,
      pickupEnabled: true,
      pickupAddress: "Makati",
    });
    assert.equal(shipping.defaultProfileId, "default");
    assert.ok(shipping.profiles[0]?.methods.some((m) => m.type === "flat"));
    assert.ok(shipping.profiles[0]?.methods.some((m) => m.type === "pickup"));
    const legacy = legacyDeliveryFromShipping(shipping);
    assert.equal(legacy.flatRate, 120);
    assert.equal(legacy.freeDeliveryMin, 600);
    assert.equal(legacy.pickupAddress, "Makati");
  });
});

describe("resolveShippingFee", () => {
  it("applies free shipping threshold", () => {
    const shipping = normalizeShippingJson({
      profiles: [
        {
          id: "default",
          name: "Default",
          methods: [
            {
              id: "flat",
              type: "flat",
              zones: [],
              rates: [{ id: "r1", basis: "flat", amount: 89 }],
              freeAboveSubtotal: 500,
            },
          ],
        },
      ],
    });
    const under = resolveShippingFee({ shipping, subtotal: 400 });
    const over = resolveShippingFee({ shipping, subtotal: 500 });
    assert.equal(under.fee, 89);
    assert.equal(over.fee, 0);
    assert.equal(over.free, true);
  });

  it("matches city zone rates", () => {
    const shipping = normalizeShippingJson({
      profiles: [
        {
          id: "default",
          name: "Default",
          methods: [
            {
              id: "flat",
              type: "flat",
              zones: [
                {
                  id: "ncr",
                  name: "NCR",
                  match: { cities: ["Makati"] },
                },
              ],
              rates: [
                { id: "r-ncr", zoneId: "ncr", basis: "flat", amount: 70 },
                { id: "r-default", basis: "flat", amount: 120 },
              ],
            },
          ],
        },
      ],
    });
    const fee = resolveShippingFee({
      shipping,
      subtotal: 100,
      city: "Makati City",
    });
    assert.equal(fee.fee, 70);
  });
});
