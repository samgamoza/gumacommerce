import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  allowIntegrationMocks,
  assertIntegrationReady,
  getIntegrationReport,
  getRuntimeMode,
  IntegrationNotConfiguredError,
} from "./integrations";
import { PayMongoClient } from "../payments/paymongo";
import { LalamoveClient } from "../delivery/lalamove";
import { SemaphoreClient } from "../notifications/sms";

const ENV_KEYS = [
  "NODE_ENV",
  "VERCEL_ENV",
  "GUMA_ALLOW_INTEGRATION_MOCKS",
  "GUMA_TEST_ADAPTERS",
  "PAYMONGO_SECRET_KEY",
  "PAYMONGO_WEBHOOK_SECRET",
  "LALAMOVE_API_KEY",
  "LALAMOVE_API_SECRET",
  "SEMAPHORE_API_KEY",
  "AUTH_SECRET",
] as const;

const snapshot: Record<string, string | undefined> = {};

function saveEnv() {
  for (const key of ENV_KEYS) {
    snapshot[key] = process.env[key];
  }
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearIntegrationEnv() {
  delete process.env.PAYMONGO_SECRET_KEY;
  delete process.env.PAYMONGO_WEBHOOK_SECRET;
  delete process.env.LALAMOVE_API_KEY;
  delete process.env.LALAMOVE_API_SECRET;
  delete process.env.SEMAPHORE_API_KEY;
  delete process.env.AUTH_SECRET;
}

describe("integration config — Priority 1 fail-closed", () => {
  saveEnv();
  afterEach(() => {
    restoreEnv();
  });

  it("treats VERCEL_ENV=production as production even when NODE_ENV=production", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    delete process.env.GUMA_TEST_ADAPTERS;
    assert.equal(getRuntimeMode(), "production");
    assert.equal(allowIntegrationMocks(), false);
  });

  it("allows mocks in development by default", () => {
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;
    delete process.env.GUMA_ALLOW_INTEGRATION_MOCKS;
    assert.equal(getRuntimeMode(), "development");
    assert.equal(allowIntegrationMocks(), true);
  });

  it("disallows mocks in development when GUMA_ALLOW_INTEGRATION_MOCKS=false", () => {
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;
    process.env.GUMA_ALLOW_INTEGRATION_MOCKS = "false";
    assert.equal(allowIntegrationMocks(), false);
  });

  it("never allows mocks in production even if GUMA_ALLOW_INTEGRATION_MOCKS=true", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.GUMA_ALLOW_INTEGRATION_MOCKS = "true";
    assert.equal(allowIntegrationMocks(), false);
  });

  it("reports production blockers when PayMongo is missing", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    clearIntegrationEnv();
    process.env.AUTH_SECRET = "x".repeat(40);
    const report = getIntegrationReport();
    assert.equal(report.production, true);
    assert.equal(report.ok, false);
    assert.ok(report.blockers.some((b) => b.id === "paymongo"));
  });

  it("PayMongo createPaymentIntent throws in production without credentials", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    clearIntegrationEnv();
    const client = new PayMongoClient("");
    await assert.rejects(
      () =>
        client.createPaymentIntent({
          amountCentavos: 10000,
          description: "test",
        }),
      (err: unknown) => err instanceof IntegrationNotConfiguredError
    );
  });

  it("PayMongo createPaymentIntent returns labeled mock in development", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;
    delete process.env.GUMA_ALLOW_INTEGRATION_MOCKS;
    clearIntegrationEnv();
    const client = new PayMongoClient("");
    const intent = await client.createPaymentIntent({
      amountCentavos: 10000,
      description: "test",
    });
    assert.equal(intent.mock, true);
    assert.ok(intent.id.startsWith("pi_mock_"));
  });

  it("rejects placeholder sk_test_xxx as not configured in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    const client = new PayMongoClient("sk_test_xxx");
    await assert.rejects(
      () =>
        client.createPaymentIntent({
          amountCentavos: 10000,
          description: "test",
        }),
      (err: unknown) => err instanceof IntegrationNotConfiguredError
    );
  });

  it("Lalamove book of mock quote is refused in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    clearIntegrationEnv();
    const client = new LalamoveClient("", "", "sandbox");
    await assert.rejects(
      () =>
        client.bookDelivery({
          quotationId: "quote_mock_1",
          stopIds: { pickup: "a", dropoff: "b" },
          recipientName: "Buyer",
          recipientPhone: "+639171234567",
        }),
      /mock Lalamove|not configured/i
    );
  });

  it("Semaphore returns success:false (not mock success) in production without key", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    clearIntegrationEnv();
    const sms = new SemaphoreClient("");
    const result = await sms.send({ to: "+639171234567", message: "hi" });
    assert.equal(result.success, false);
    assert.equal(result.mock, undefined);
    assert.ok(result.error);
  });

  it("assertIntegrationReady throws when mocks are forbidden", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    clearIntegrationEnv();
    assert.throws(
      () => assertIntegrationReady("paymongo"),
      (err: unknown) => err instanceof IntegrationNotConfiguredError
    );
  });
});
