import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLAN_AI_LIMITS,
  PLAN_PRICES_PHP,
  SELLER_PLANS,
  getSellerPlan,
  normalizePlanId,
  planAtLeast,
  planDisplayName,
} from "./index";

describe("canonical plan catalog", () => {
  it("exposes exactly free / growth / pro", () => {
    assert.deepEqual(
      SELLER_PLANS.map((p) => p.id),
      ["free", "growth", "pro"]
    );
  });

  it("uses constitution labels Free / Pro / Advance", () => {
    assert.equal(getSellerPlan("free").constitutionLabel, "Free");
    assert.equal(getSellerPlan("growth").constitutionLabel, "Pro");
    assert.equal(getSellerPlan("pro").constitutionLabel, "Advance");
    assert.equal(planDisplayName("growth"), "Pro");
    assert.equal(planDisplayName("pro"), "Advance");
  });

  it("keeps billing prices ₱0 / ₱499 / ₱999", () => {
    assert.equal(getSellerPlan("free").priceMonthly, 0);
    assert.equal(PLAN_PRICES_PHP.growth, 499);
    assert.equal(PLAN_PRICES_PHP.pro, 999);
  });

  it("normalizes legacy aliases", () => {
    assert.equal(normalizePlanId("starter"), "growth");
    assert.equal(normalizePlanId("advance"), "pro");
    assert.equal(normalizePlanId("sulit"), "free");
    assert.equal(normalizePlanId("GROWTH"), "growth");
    assert.equal(normalizePlanId(null), "free");
  });

  it("ranks plans for gating", () => {
    assert.equal(planAtLeast("free", "growth"), false);
    assert.equal(planAtLeast("growth", "growth"), true);
    assert.equal(planAtLeast("pro", "growth"), true);
    assert.equal(planAtLeast("starter", "growth"), true);
  });

  it("aligns AI limit labels with constitution names", () => {
    assert.equal(PLAN_AI_LIMITS.free.label, "Free");
    assert.equal(PLAN_AI_LIMITS.growth.label, "Pro");
    assert.equal(PLAN_AI_LIMITS.pro.label, "Advance");
    assert.equal(PLAN_AI_LIMITS.free.generationsPerMonth, 5);
    assert.equal(PLAN_AI_LIMITS.growth.generationsPerMonth, 100);
    assert.equal(PLAN_AI_LIMITS.pro.generationsPerMonth, 500);
  });
});
