import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  brandGuardHasErrors,
  hintBrandGuardCopy,
  lintBrandGuardCopy,
  validateBrandGuardPersonalize,
} from "./brand-guard";

describe("lintBrandGuardCopy", () => {
  it("rejects not-just tropes", () => {
    const issues = lintBrandGuardCopy("Not just a store — it's a lifestyle", "tagline");
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.code, "copy_not_just_trope");
  });

  it("rejects fabricated stats", () => {
    const issues = lintBrandGuardCopy("Trusted by 10k+ sellers nationwide", "promoTitle");
    assert.ok(issues.some((i) => i.code === "copy_fabricated_stats"));
  });

  it("allows concrete shop copy", () => {
    assert.equal(lintBrandGuardCopy("Ube cakes from Quezon City", "tagline").length, 0);
  });
});

describe("validateBrandGuardPersonalize", () => {
  it("allowlists curated ube palette and does not flag its purple primary", () => {
    const issues = validateBrandGuardPersonalize({
      paletteId: "ube-cream",
      primaryColor: "#7c3aed",
      accentColor: "#fb923c",
      tagline: "Ube cream cakes, same-day QC",
    });
    assert.equal(brandGuardHasErrors(issues), false);
    assert.ok(!issues.some((i) => i.code === "purple_glass_default"));
  });

  it("warns on bare indigo/violet hex without allowlisted palette", () => {
    const issues = validateBrandGuardPersonalize({
      primaryColor: "#6366f1",
      tagline: "Fresh bread daily",
    });
    assert.ok(issues.some((i) => i.code === "purple_glass_default" && i.severity === "warn"));
    assert.equal(brandGuardHasErrors(issues), false);
  });

  it("errors on slop tropes even with allowlisted palette", () => {
    const issues = validateBrandGuardPersonalize({
      paletteId: "guma-green",
      tagline: "Not just snacks - it's a movement",
    });
    assert.equal(brandGuardHasErrors(issues), true);
  });
});

describe("hintBrandGuardCopy", () => {
  it("returns soft hints without requiring an API call", () => {
    const hints = hintBrandGuardCopy("Elevate your brand with seamless checkout");
    assert.ok(hints.length >= 1);
  });
});
