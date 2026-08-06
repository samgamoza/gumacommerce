import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchBusinessCategories, popularCategoryLabels } from "./shop-category-guide";

describe("matchBusinessCategories", () => {
  it("maps life insurance vernacular to Insurance & Financial Services", () => {
    const hits = matchBusinessCategories("life insurance");
    assert.ok(hits.length > 0);
    assert.equal(hits[0]!.label, "Insurance & Financial Services");
  });

  it("maps milk tea to Food & Beverage", () => {
    const hits = matchBusinessCategories("milk tea");
    assert.equal(hits[0]!.label, "Food & Beverage");
  });

  it("maps nail salon to Beauty Salons & Spas", () => {
    const hits = matchBusinessCategories("nail salon");
    assert.equal(hits[0]!.label, "Beauty Salons & Spas");
  });

  it("does not rank food first for financial advisor", () => {
    const hits = matchBusinessCategories("financial advisor");
    assert.equal(hits[0]!.label, "Insurance & Financial Services");
    assert.ok(!hits.slice(0, 3).some((h) => h.label === "Food & Beverage"));
  });
});

describe("popularCategoryLabels", () => {
  it("includes insurance among popular starts", () => {
    assert.ok(popularCategoryLabels().includes("Insurance & Financial Services"));
  });
});
