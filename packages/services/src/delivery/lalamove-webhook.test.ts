import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { lalamoveSignatureBase, rawJsonValue, verifyLalamoveWebhook } from "./lalamove-webhook";

const secret = "sk_test_secret";
const path = "/api/webhooks/lalamove";
const timestamp = 1790924065123;
const sign = (text: string) => createHmac("sha256", secret).update(text).digest("hex");

test("documented layout: path + JSON data, signed with the API secret", () => {
  const data = { order: { orderId: "1234", status: "COMPLETED" } };
  const signature = sign(lalamoveSignatureBase({ timestamp, path, data }));
  const payload = { apiKey: "pk_test", timestamp, signature, eventType: "ORDER_STATUS_CHANGED", data };

  assert.deepEqual(verifyLalamoveWebhook({ payload, path, secret, expectedApiKey: "pk_test" }), { ok: true, variant: "json" });
  assert.equal(verifyLalamoveWebhook({ payload, path: "/other", secret }).ok, false, "path is signed");
  assert.equal(verifyLalamoveWebhook({ payload, path, secret, expectedApiKey: "pk_live" }).ok, false);
  assert.equal(
    verifyLalamoveWebhook({ payload: { ...payload, data: { order: { orderId: "1234", status: "CANCELED" } } }, path, secret }).ok,
    false,
    "tampered data"
  );
  assert.equal(verifyLalamoveWebhook({ payload, path, secret: "" }).ok, false);
});

test("raw-bytes and trailing-slash readings are accepted, reported, and pinnable", () => {
  // Lalamove formats with spaces; our JSON.stringify wouldn't reproduce them.
  const rawBody = `{"apiKey":"pk","timestamp":${timestamp},"signature":"SIG","eventType":"ORDER_STATUS_CHANGED","data": { "order" : { "orderId": "9", "status": "PICKED_UP" } }}`;
  const rawData = rawJsonValue(rawBody, "data")!;
  assert.equal(rawData, `{ "order" : { "orderId": "9", "status": "PICKED_UP" } }`);

  const signature = sign(`${timestamp}\r\nPOST\r\n${path}/\r\n\r\n${rawData}`);
  const payload = JSON.parse(rawBody.replace("SIG", signature));
  const result = verifyLalamoveWebhook({ payload, path, secret, rawBody: rawBody.replace("SIG", signature) });
  assert.deepEqual(result, { ok: true, variant: "raw-slash" });
  assert.equal(
    verifyLalamoveWebhook({ payload, path, secret, rawBody: rawBody.replace("SIG", signature), only: "json" }).ok,
    false,
    "pinning rejects other readings"
  );
});

test("rawJsonValue handles strings with braces and missing keys", () => {
  assert.equal(rawJsonValue(`{"data":{"note":"a } b \\" {","x":[1,{"y":2}]}}`, "data"), `{"note":"a } b \\" {","x":[1,{"y":2}]}`);
  assert.equal(rawJsonValue(`{"nodata":1}`, "data"), null);
});
