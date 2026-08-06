import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCheckoutTotals,
  isPaymentMethodEnabled,
  normalizeCheckoutJson,
} from "./tenant-checkout";

describe("normalizeCheckoutJson", () => {
  it("defaults payment adapters and abandoned window", () => {
    const normalized = normalizeCheckoutJson({});
    assert.equal(normalized.codEnabled, true);
    assert.equal(normalized.abandonedAfterMinutes, 60);
    assert.equal(normalized.paymentAdapters?.manual_ewallet?.gcash, true);
    assert.equal(normalized.paymentAdapters?.paymongo?.gcash, false);
    assert.equal(normalized.paymentAdapters?.paymongo?.card, false);
  });
});

describe("computeCheckoutTotals", () => {
  it("applies percent coupon, exclusive tax, and delivery", () => {
    const totals = computeCheckoutTotals({
      subtotal: 1000,
      deliveryFee: 50,
      couponCode: "SAVE10",
      checkout: normalizeCheckoutJson({
        tax: { enabled: true, ratePercent: 12, inclusive: false },
        coupons: [{ code: "SAVE10", type: "percent", value: 10, active: true }],
      }),
    });
    assert.equal(totals.discount, 100);
    assert.equal(totals.tax, 108); // 12% of 900
    assert.equal(totals.total, 1058); // 900 + 108 + 50
    assert.equal(totals.couponCode, "SAVE10");
  });

  it("caps discount at subtotal", () => {
    const totals = computeCheckoutTotals({
      subtotal: 100,
      deliveryFee: 0,
      couponCode: "BIG",
      checkout: normalizeCheckoutJson({
        coupons: [{ code: "BIG", type: "fixed", value: 500, active: true }],
      }),
    });
    assert.equal(totals.discount, 100);
    assert.equal(totals.total, 0);
  });
});

describe("isPaymentMethodEnabled", () => {
  it("respects adapter toggles", () => {
    const checkout = normalizeCheckoutJson({
      codEnabled: true,
      paymentAdapters: {
        cod: true,
        manual_ewallet: { gcash: false, maya: false, bank: false },
        paymongo: { gcash: true, paymaya: false, qrph: true, card: true },
      },
    });
    assert.equal(isPaymentMethodEnabled(checkout, "gcash"), true);
    assert.equal(isPaymentMethodEnabled(checkout, "paymaya"), false);
    assert.equal(isPaymentMethodEnabled(checkout, "card"), true);
    assert.equal(isPaymentMethodEnabled(checkout, "cod"), true);
  });
});
