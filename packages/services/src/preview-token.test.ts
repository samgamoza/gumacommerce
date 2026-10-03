import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { signStorefrontPreviewToken, verifyStorefrontPreviewToken } from "./preview-token";

const saved = { a: process.env.AUTH_SECRET, p: process.env.STOREFRONT_PREVIEW_SECRET };
afterEach(() => {
  if (saved.a === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = saved.a;
  if (saved.p === undefined) delete process.env.STOREFRONT_PREVIEW_SECRET;
  else process.env.STOREFRONT_PREVIEW_SECRET = saved.p;
});

test("preview token: valid for its shop only, expires, needs a secret", () => {
  process.env.STOREFRONT_PREVIEW_SECRET = "x".repeat(40);
  const now = 1_800_000_000;
  const token = signStorefrontPreviewToken("tita-bea", now);
  assert.equal(verifyStorefrontPreviewToken("tita-bea", token, now + 60), true);
  assert.equal(verifyStorefrontPreviewToken("other-shop", token, now + 60), false);
  assert.equal(verifyStorefrontPreviewToken("tita-bea", token, now + 3 * 3600), false);
  const tampered = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
  assert.equal(verifyStorefrontPreviewToken("tita-bea", tampered, now), false);
  assert.equal(verifyStorefrontPreviewToken("tita-bea", "", now), false);

  delete process.env.STOREFRONT_PREVIEW_SECRET;
  delete process.env.AUTH_SECRET;
  assert.equal(verifyStorefrontPreviewToken("tita-bea", token, now + 60), false);
  assert.throws(() => signStorefrontPreviewToken("tita-bea", now));
});
