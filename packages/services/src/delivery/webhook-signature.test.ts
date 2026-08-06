import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { verifyTimestampedHmacSignature } from "./webhook-signature";

describe("courier webhook HMAC", () => {
  const secret = "grab_webhook_secret";
  const rawBody = JSON.stringify({ deliveryID: "del_1", status: "COMPLETED" });
  const timestamp = Math.floor(Date.now() / 1000);

  it("accepts a matching signature", () => {
    const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    assert.equal(
      verifyTimestampedHmacSignature({ rawBody, signature, timestamp, secret }),
      true
    );
  });

  it("rejects a bad signature", () => {
    assert.equal(
      verifyTimestampedHmacSignature({
        rawBody,
        signature: "deadbeef",
        timestamp,
        secret,
      }),
      false
    );
  });

  it("rejects empty secret", () => {
    assert.equal(
      verifyTimestampedHmacSignature({
        rawBody,
        signature: "abc",
        timestamp,
        secret: "",
      }),
      false
    );
  });
});
