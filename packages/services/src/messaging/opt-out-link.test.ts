import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { optOutUrl, signOptOutToken, verifyOptOutToken, withOptOutFooter } from "./opt-out-link";

const saved = { o: process.env.SMS_OPT_OUT_SECRET, p: process.env.STOREFRONT_PREVIEW_SECRET, a: process.env.AUTH_SECRET };
afterEach(() => {
  for (const [k, v] of [["SMS_OPT_OUT_SECRET", saved.o], ["STOREFRONT_PREVIEW_SECRET", saved.p], ["AUTH_SECRET", saved.a]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

test("opt-out token round-trips the phone and rejects tampering", () => {
  process.env.SMS_OPT_OUT_SECRET = "s".repeat(40);
  const token = signOptOutToken("+63 917 123 4567");
  assert.equal(verifyOptOutToken(token), "09171234567", "normalized to 09…");
  assert.equal(verifyOptOutToken(signOptOutToken("09171234567")), "09171234567");

  const [enc, sig] = token.split(".");
  const other = Buffer.from("09998887777").toString("base64url");
  assert.equal(verifyOptOutToken(`${other}.${sig}`), null, "can't opt out someone else");
  assert.equal(verifyOptOutToken(`${enc}.${sig!.slice(0, -1)}x`), null);
  assert.equal(verifyOptOutToken(""), null);
  assert.equal(verifyOptOutToken("garbage"), null);

  const url = optOutUrl("09171234567", "https://kart.guma.one/");
  assert.match(url, /^https:\/\/kart\.guma\.one\/stop\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{12}$/);
  assert.ok(url.length < 60, "short enough for one SMS segment budget");
  assert.match(withOptOutFooter("Your cart is waiting.", "09171234567", "https://kart.guma.one"), /Stop reminders: https:\/\/kart\.guma\.one\/stop\//);
});

test("no secret → no links, nothing verifies", () => {
  delete process.env.SMS_OPT_OUT_SECRET;
  delete process.env.STOREFRONT_PREVIEW_SECRET;
  delete process.env.AUTH_SECRET;
  assert.throws(() => signOptOutToken("09171234567"));
  assert.equal(verifyOptOutToken("MDkxNzEyMzQ1Njc.abcdefghijkl"), null);
});
