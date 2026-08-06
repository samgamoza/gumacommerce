import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchBusinessCategories,
  popularCategoryLabels,
  predictBusinessCategories,
} from "./shop-category-guide";

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

  it("maps cellphone repair to Appliance & Device Repair", () => {
    const hits = matchBusinessCategories("cellphone repair");
    assert.equal(hits[0]!.label, "Appliance & Device Repair");
  });

  it("maps washing machine to Appliance & Device Repair", () => {
    const hits = matchBusinessCategories("washing machine");
    assert.equal(hits[0]!.label, "Appliance & Device Repair");
  });

  it("maps aircon repair to HVAC & Air Conditioning", () => {
    const hits = matchBusinessCategories("aircon repair");
    assert.equal(hits[0]!.label, "HVAC & Air Conditioning");
  });

  it("maps house painting to House Painting & Decorating", () => {
    const hits = matchBusinessCategories("house painting");
    assert.equal(hits[0]!.label, "House Painting & Decorating");
  });

  it("maps car painting to Auto Body & Painting", () => {
    const hits = matchBusinessCategories("car painting");
    assert.equal(hits[0]!.label, "Auto Body & Painting");
  });

  it("maps car wash to Car Wash & Detailing", () => {
    const hits = matchBusinessCategories("car wash");
    assert.equal(hits[0]!.label, "Car Wash & Detailing");
  });

  it("maps pest control to Pest Control", () => {
    const hits = matchBusinessCategories("pest control");
    assert.equal(hits[0]!.label, "Pest Control");
  });

  it("maps lawn care to Landscaping & Gardening", () => {
    const hits = matchBusinessCategories("lawn care");
    assert.equal(hits[0]!.label, "Landscaping & Gardening");
  });

  it("maps wedding planner to Wedding Planning & Events", () => {
    const hits = matchBusinessCategories("wedding planner");
    assert.equal(hits[0]!.label, "Wedding Planning & Events");
  });
});

describe("popularCategoryLabels", () => {
  it("includes insurance among popular starts", () => {
    assert.ok(popularCategoryLabels().includes("Insurance & Financial Services"));
  });

  it("includes on-demand service starts", () => {
    const popular = popularCategoryLabels();
    assert.ok(popular.includes("Appliance & Device Repair"));
    assert.ok(popular.includes("House Painting & Decorating"));
    assert.ok(popular.includes("Pest Control"));
  });
});

describe("predictBusinessCategories", () => {
  it("predicts from shop name cues without listing the catalog", () => {
    const hits = predictBusinessCategories({ shopName: "QC Aircon Repair Pros" });
    assert.ok(hits.length > 0 && hits.length <= 5);
    assert.equal(hits[0]!.label, "HVAC & Air Conditioning");
  });

  it("predicts insurance from a sentence cue", () => {
    const hits = predictBusinessCategories({
      text: "I sell life insurance and VUL plans",
    });
    assert.equal(hits[0]!.label, "Insurance & Financial Services");
    assert.ok(hits.length <= 5);
  });

  it("returns empty when there is no cue", () => {
    assert.deepEqual(predictBusinessCategories({}), []);
  });

  it("does not flood with unrelated verticals for a tight cue", () => {
    const hits = predictBusinessCategories({ text: "pest control fogging" });
    assert.equal(hits[0]!.label, "Pest Control");
    assert.ok(hits.every((h) => h.score >= Math.floor(hits[0]!.score * 0.62)));
  });
});
