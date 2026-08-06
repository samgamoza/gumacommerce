import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  helpdeskNotifyEmail,
  isEmailConfigured,
  notifyHelpdeskTicketCreated,
  sendTransactionalEmail,
} from "./email";

const ORIGINAL = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL);
});

describe("email notifications — fail-closed", () => {
  it("reports not sent (not mock success) in production without RESEND_API_KEY", async () => {
    process.env.VERCEL_ENV = "production";
    process.env.NODE_ENV = "production";
    delete process.env.GUMA_ALLOW_INTEGRATION_MOCKS;
    delete process.env.RESEND_API_KEY;

    const result = await sendTransactionalEmail({
      to: "buyer@example.com",
      subject: "Test",
      text: "Hello",
    });

    assert.equal(result.sent, false);
    assert.equal(result.mock, undefined);
    assert.match(result.error ?? "", /RESEND_API_KEY/);
  });

  it("uses labeled mock only when mocks are allowed", async () => {
    process.env.NODE_ENV = "development";
    process.env.GUMA_ALLOW_INTEGRATION_MOCKS = "true";
    delete process.env.VERCEL_ENV;
    delete process.env.RESEND_API_KEY;

    const result = await sendTransactionalEmail({
      to: "buyer@example.com",
      subject: "Mock",
      text: "Hello",
    });

    assert.equal(result.sent, false);
    assert.equal(result.mock, true);
  });

  it("skips helpdesk create notify when inbox env is missing", async () => {
    process.env.NODE_ENV = "development";
    process.env.GUMA_ALLOW_INTEGRATION_MOCKS = "true";
    delete process.env.HELPDESK_NOTIFY_EMAIL;
    delete process.env.SUPPORT_INBOX_EMAIL;
    delete process.env.RESEND_API_KEY;

    assert.equal(helpdeskNotifyEmail(), null);
    assert.equal(isEmailConfigured(), false);

    const result = await notifyHelpdeskTicketCreated({
      ticketNumber: "T-1",
      ticketId: "00000000-0000-0000-0000-000000000001",
      subject: "Help",
      channel: "web_contact",
      body: "Need help",
      requesterEmail: "a@b.com",
    });

    assert.equal(result.sent, false);
    assert.match(result.error ?? "", /HELPDESK_NOTIFY_EMAIL/);
  });
});
