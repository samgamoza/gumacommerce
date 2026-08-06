import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { PayMongoClient } from "./paymongo";

describe("PayMongo webhook signature", () => {
  const client = new PayMongoClient("sk_test_unused_for_verify");
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ data: { id: "evt_1", type: "payment.paid" } });

  function sign(ts: number): string {
    const digest = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
    return `t=${ts},te=${digest}`;
  }

  it("accepts a fresh valid signature", () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(client.verifyWebhookSignature(payload, sign(ts), secret), true);
  });

  it("rejects missing webhook secret (fail-closed)", () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(client.verifyWebhookSignature(payload, sign(ts), ""), false);
  });

  it("rejects stale timestamps outside the 5-minute window", () => {
    const ts = Math.floor(Date.now() / 1000) - 600;
    assert.equal(client.verifyWebhookSignature(payload, sign(ts), secret), false);
  });

  it("rejects tampered payloads", () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(
      client.verifyWebhookSignature(payload + " ", sign(ts), secret),
      false
    );
  });
});
