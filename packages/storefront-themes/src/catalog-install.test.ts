import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listCatalogByCategory,
  listCuratedTemplatesForDna,
  resolveCatalogInstall,
  resolveLiveTemplateForCatalogEntry,
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
