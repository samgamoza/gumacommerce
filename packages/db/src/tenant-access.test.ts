import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyTenantPublicAccess,
  checkoutHttpRejectionForStatus,
  isTenantAcceptingOrders,
  isTenantSellerWritable,
  sellerWriteHttpRejectionForStatus,
  TENANT_SUSPENDED_BUYER_MESSAGE,
  TENANT_SUSPENDED_SELLER_MESSAGE,
} from "./tenant-access";

describe("classifyTenantPublicAccess", () => {
  it("marks active tenants as live", () => {
    assert.equal(classifyTenantPublicAccess("active").kind, "live");
  });

  it("marks pending tenants for coming-soon UX", () => {
    const access = classifyTenantPublicAccess("pending");
    assert.equal(access.kind, "pending");
    if (access.kind === "pending") {
      assert.match(access.buyerMessage, /set up/i);
    }
  });

  it("marks suspended tenants with distinct unavailable copy", () => {
    const access = classifyTenantPublicAccess("suspended");
    assert.equal(access.kind, "suspended");
    if (access.kind === "suspended") {
      assert.equal(access.buyerMessage, TENANT_SUSPENDED_BUYER_MESSAGE);
      assert.equal(access.sellerMessage, TENANT_SUSPENDED_SELLER_MESSAGE);
      assert.doesNotMatch(access.buyerMessage, /coming soon/i);
    }
  });

  it("treats missing/unknown status as unavailable", () => {
    assert.equal(classifyTenantPublicAccess(null).kind, "unavailable");
    assert.equal(classifyTenantPublicAccess("archived").kind, "unavailable");
  });
});

describe("isTenantAcceptingOrders", () => {
  it("allows only active tenants", () => {
    assert.equal(isTenantAcceptingOrders("active"), true);
    assert.equal(isTenantAcceptingOrders("pending"), false);
    assert.equal(isTenantAcceptingOrders("suspended"), false);
  });
});

describe("isTenantSellerWritable", () => {
  it("blocks suspended sellers while allowing pending launch work", () => {
    assert.equal(isTenantSellerWritable("active"), true);
    assert.equal(isTenantSellerWritable("pending"), true);
    assert.equal(isTenantSellerWritable("suspended"), false);
  });
});

describe("surface gates — admin / storefront / checkout", () => {
  it("admin write surface rejects suspended tenants with TENANT_SUSPENDED", () => {
    const rejection = sellerWriteHttpRejectionForStatus("suspended");
    assert.ok(rejection);
    assert.equal(rejection?.httpStatus, 403);
    assert.equal(rejection?.code, "TENANT_SUSPENDED");
    assert.equal(sellerWriteHttpRejectionForStatus("active"), null);
  });

  it("storefront surface uses suspended copy, not coming-soon", () => {
    const access = classifyTenantPublicAccess("suspended");
    assert.equal(access.kind, "suspended");
    if (access.kind === "suspended") {
      assert.doesNotMatch(access.buyerMessage, /coming soon|being set up/i);
    }
  });

  it("checkout surface rejects suspended tenants with HTTP 403", () => {
    const rejection = checkoutHttpRejectionForStatus("suspended");
    assert.ok(rejection);
    assert.equal(rejection?.httpStatus, 403);
    assert.equal(rejection?.code, "TENANT_SUSPENDED");
    assert.equal(checkoutHttpRejectionForStatus("active"), null);
    assert.equal(checkoutHttpRejectionForStatus("pending"), null);
  });
});
