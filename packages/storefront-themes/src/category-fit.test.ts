import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveBrandKit } from "./brand-kit";
import {
  isFoodVerticalTemplate,
  preferredTemplatesForCategory,
  templateFitsCategory,
} from "./category-fit";
import { recommendTemplates } from "./recommend-templates";
import { buildStoreDNA } from "./store-dna";

describe("category-fit guards", () => {
  it("never fits food vertical templates to Insurance & Financial Services", () => {
    for (const id of [
      "sarab",
      "foodmart",
      "fruitables",
      "organic",
      "blush-bakery",
      "simply-sweet",
      "street-cart",
    ]) {
      assert.equal(templateFitsCategory(id, "Insurance & Financial Services"), false);
      assert.ok(isFoodVerticalTemplate(id));
    }
  });

  it("prefers mono-market for insurance", () => {
    assert.equal(preferredTemplatesForCategory("Insurance & Financial Services")[0], "mono-market");
  });

  it("deriveBrandKit never assigns Sarab to an insurance shop", () => {
    const kit = deriveBrandKit({
      shopName: "OneStop",
      slug: "onestop",
      category: "Insurance & Financial Services",
      vibe: "bold", // previously pulled street-cart / sarab
      subscriptionPlan: "free",
    });
    assert.notEqual(kit.templateId, "sarab");
    assert.ok(kit.templateId);
    assert.ok(templateFitsCategory(kit.templateId, "Insurance & Financial Services"));
    assert.ok(kit.promoTitle);
    assert.match(kit.promoTitle, /consult|guidance|plan|protect|assessment|advisor/i);
  });

  it("recommendTemplates top pick for insurance is not a food skin", () => {
    const dna = buildStoreDNA({
      businessName: "OneStop",
      category: "Insurance & Financial Services",
      vibe: "bold",
    });
    const ranked = recommendTemplates(dna, { plan: "free", limit: 3 });
    assert.ok(ranked.length > 0);
    assert.ok(!isFoodVerticalTemplate(ranked[0]!.id));
    assert.ok(ranked.every((r) => !isFoodVerticalTemplate(r.id)));
  });

  it("rejects cross-vertical skins outside the category shortlist", () => {
    assert.equal(templateFitsCategory("electro", "Insurance & Financial Services"), false);
    assert.equal(templateFitsCategory("carserv", "Insurance & Financial Services"), false);
    assert.equal(templateFitsCategory("mono-market", "Insurance & Financial Services"), true);
    assert.equal(templateFitsCategory("aircon", "HVAC & Air Conditioning"), true);
    assert.equal(templateFitsCategory("sarab", "HVAC & Air Conditioning"), false);
  });

  it("recommendTemplates only returns category shortlist", () => {
    const dna = buildStoreDNA({
      businessName: "CoolFix Aircon",
      category: "HVAC & Air Conditioning",
      vibe: "bold",
    });
    const preferred = preferredTemplatesForCategory("HVAC & Air Conditioning");
    const ranked = recommendTemplates(dna, { plan: "free", limit: 5 });
    assert.ok(ranked.length > 0);
    assert.ok(ranked.every((r) => preferred.includes(r.id)));
  });
});
