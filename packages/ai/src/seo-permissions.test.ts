import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveApprovalLevel } from "./permissions";

describe("SEO permission scope", () => {
  it("requires human_review on all plans", () => {
    assert.equal(resolveApprovalLevel("ai.suggest.seo", "free"), "human_review");
    assert.equal(resolveApprovalLevel("ai.suggest.seo", "growth"), "human_review");
    assert.equal(resolveApprovalLevel("ai.suggest.seo", "pro"), "human_review");
  });
});

describe("Checkout permission scope", () => {
  it("requires human_review on all plans", () => {
    assert.equal(resolveApprovalLevel("ai.suggest.checkout", "free"), "human_review");
    assert.equal(resolveApprovalLevel("ai.suggest.checkout", "growth"), "human_review");
    assert.equal(resolveApprovalLevel("ai.suggest.checkout", "pro"), "human_review");
  });
});

describe("Shipping permission scope", () => {
  it("requires human_review on all plans", () => {
    assert.equal(resolveApprovalLevel("ai.suggest.shipping", "free"), "human_review");
    assert.equal(resolveApprovalLevel("ai.suggest.shipping", "growth"), "human_review");
    assert.equal(resolveApprovalLevel("ai.suggest.shipping", "pro"), "human_review");
  });
});
