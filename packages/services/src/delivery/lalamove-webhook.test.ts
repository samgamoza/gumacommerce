import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { lalamoveSignatureBase, verifyLalamoveWebhook } from "./lalamove-webhook";

test("lalamove webhook: path + data signed with the API secret", () => {
  const secret = "sk_test_secret";
  const data = { order: { orderId: "1234", status: "COMPLETED" } };
  const timestamp = 1790924065123;
  const path = "/api/webhooks/lalamove";
  const signature = createHmac("sha256", secret)
    .update(lalamoveSignatureBase({ timestamp, path, data }))
    .digest("hex");
  const payload = { apiKey: "pk_test", timestamp, signature, eventType: "ORDER_STATUS_CHANGED", data };

  assert.equal(verifyLalamoveWebhook({ payload, path, secret, expectedApiKey: "pk_test" }), true);
  assert.equal(verifyLalamoveWebhook({ payload, path: "/other", secret }), false, "path is signed");
  assert.equal(verifyLalamoveWebhook({ payload, path, secret, expectedApiKey: "pk_live" }), false);
  assert.equal(
    verifyLalamoveWebhook({ payload: { ...payload, data: { order: { orderId: "1234", status: "CANCELED" } } }, path, secret }),
    false,
    "tampered data"
  );
  assert.equal(verifyLalamoveWebhook({ payload, path, secret: "" }), false);
});
