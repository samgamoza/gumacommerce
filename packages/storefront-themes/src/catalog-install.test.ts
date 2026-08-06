import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  catalogCategoryFitsSeller,
  listCatalogByCategory,
  listCuratedTemplatesForDna,
  resolveCatalogInstall,
  resolveLiveTemplateForCatalogEntry,
  selectionFitsSellerCategory,
} from "./catalog-install";
import { getBundleCatalogEntry } from "./bundle-catalog";
import { buildStoreDNA } from "./store-dna";

describe("resolveCatalogInstall", () => {
  it("resolves a curated food skin to Sarab with catalog identity", () => {
    const restoran = getBundleCatalogEntry("restoran");
    assert.ok(restoran);
    const install = resolveCatalogInstall("restoran", { plan: "free" });
    assert.ok(install);
    assert.equal(install.fromCatalog, true);
    assert.equal(install.catalogId, "restoran");
    assert.equal(install.catalogLabel, "Restoran");
    assert.equal(install.liveTemplateId, "sarab");
    assert.ok(install.storeLook);
  });

  it("resolves a bare live template id without catalog fields", () => {
    const install = resolveCatalogInstall("sarab", { plan: "free" });
    assert.ok(install);
    assert.equal(install.fromCatalog, false);
    assert.equal(install.liveTemplateId, "sarab");
    assert.equal(install.catalogId, null);
  });

  it("rejects non-seller catalog statuses", () => {
    assert.equal(resolveCatalogInstall("star-admin2"), null);
    assert.equal(resolveCatalogInstall("tivo"), null);
  });

  it("spreads storeLook across food catalog skins on the same live renderer", () => {
    const dna = buildStoreDNA({
      businessName: "Test Kitchen",
      category: "Food & Beverage",
      vibe: "fresh",
    });
    const cards = listCuratedTemplatesForDna(dna, { plan: "free", limit: 48 }).filter(
      (c) => c.installTemplateId === "sarab"
    );
    assert.ok(cards.length >= 2);
    const looks = new Set(
      cards.map((c) => JSON.stringify(resolveCatalogInstall(c.proposedId)?.storeLook))
    );
    assert.ok(looks.size >= 2, `expected ≥2 looks among ${cards.length} Sarab skins, got ${looks.size}`);
  });
});

describe("listCuratedTemplatesForDna", () => {
  it("returns installable curated cards for Food & Beverage", () => {
    const dna = buildStoreDNA({
      businessName: "Test Kitchen",
      category: "Food & Beverage",
      vibe: "fresh",
    });
    const cards = listCuratedTemplatesForDna(dna, { plan: "free", limit: 48 });
    assert.ok(cards.length > 0);
    assert.ok(cards.every((c) => c.installTemplateId));
    assert.ok(cards.some((c) => c.proposedId === "restoran" || c.proposedId === "sarab"));
  });
});

describe("listCatalogByCategory", () => {
  it("groups the full Free Bundle catalog", () => {
    const groups = listCatalogByCategory();
    assert.ok(groups.length > 5);
    const total = groups.reduce((n, g) => n + g.entries.length, 0);
    assert.equal(total, 100);
  });
});

describe("resolveLiveTemplateForCatalogEntry", () => {
  it("falls back by category when no similarIntegratedId", () => {
    const woody = getBundleCatalogEntry("woody");
    assert.ok(woody);
    assert.equal(resolveLiveTemplateForCatalogEntry(woody), "aircon");
  });
});

describe("selectionFitsSellerCategory", () => {
  it("allows category shortlist live ids and rejects cross-vertical", () => {
    assert.equal(selectionFitsSellerCategory("mono-market", "Insurance & Financial Services"), true);
    assert.equal(selectionFitsSellerCategory("sarab", "Insurance & Financial Services"), false);
    assert.equal(selectionFitsSellerCategory("aircon", "HVAC & Air Conditioning"), true);
  });

  it("allows explicit neighbor catalog categories for on-demand verticals", () => {
    assert.equal(
      catalogCategoryFitsSeller("HVAC & Air Conditioning", "Appliance & Device Repair"),
      true
    );
    assert.equal(
      catalogCategoryFitsSeller("Food & Beverage", "Appliance & Device Repair"),
      false
    );
  });
});
