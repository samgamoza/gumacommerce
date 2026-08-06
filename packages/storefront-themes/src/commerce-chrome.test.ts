import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isServiceBusinessCategory,
  resolveCommerceChrome,
} from "./commerce-chrome";

describe("resolveCommerceChrome", () => {
  it("uses inquiry language for Insurance & Financial Services", () => {
    const chrome = resolveCommerceChrome("Insurance & Financial Services");
    assert.equal(chrome.mode, "service");
    assert.equal(chrome.addLabel, "Add to inquiry");
    assert.equal(chrome.trustSecondary, "Advisor support");
    assert.ok(chrome.ctaHint);
  });

  it("keeps retail cart language for Food & Beverage", () => {
    const chrome = resolveCommerceChrome("Food & Beverage");
    assert.equal(chrome.mode, "retail");
    assert.equal(chrome.addLabel, "Add to Cart");
    assert.equal(chrome.trustSecondary, "Fast delivery");
  });

  it("flags service categories correctly", () => {
    assert.equal(isServiceBusinessCategory("Professional & Consulting"), true);
    assert.equal(isServiceBusinessCategory("Fashion & Apparel"), false);
  });
});
