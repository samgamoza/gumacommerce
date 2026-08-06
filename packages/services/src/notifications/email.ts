import {
  allowIntegrationMocks,
  assertIntegrationReady,
} from "../config/integrations";
import { createLogger } from "../logging";

const log = createLogger("email");
const RESEND_API = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  /** True only when a real provider accepted the message. */
  sent: boolean;
  id?: string;
  /** Labeled mock — never set when claiming a real send. */
  mock?: boolean;
  error?: string;
}

function resendApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

function emailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Guma Commerce <onboarding@resend.dev>"
  );
}

export function isEmailConfigured(): boolean {
  return Boolean(resendApiKey());
}

export function helpdeskNotifyEmail(): string | null {
  const value =
    process.env.HELPDESK_NOTIFY_EMAIL?.trim() ||
    process.env.SUPPORT_INBOX_EMAIL?.trim() ||
    "";
  return value || null;
}

/**
 * Transactional email via Resend (already referenced by auth verification stub).
 * Fail-closed: never reports success when the provider did not send.
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = (Array.isArray(input.to) ? input.to : [input.to])
    .map((v) => v.trim())
    .filter(Boolean);
  if (to.length === 0) {
    return { sent: false, error: "No recipient email address." };
  }

  const apiKey = resendApiKey();
  if (!apiKey) {
    if (allowIntegrationMocks()) {
      assertIntegrationReady("email", { operation: "send" });
      log.warn("Email mock — RESEND_API_KEY missing; labeled mock only", {
        to: to.join(","),
        subject: input.subject,
      });
      console.info("[Email Mock]", { to, subject: input.subject, text: input.text });
      return { sent: false, mock: true, id: `email_mock_${Date.now()}` };
    }

    log.warn("RESEND_API_KEY not configured — email not sent", {
      to: to.join(","),
      subject: input.subject,
    });
    return {
      sent: false,
      error: "RESEND_API_KEY is not configured. Email was not sent.",
    };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>`,
        reply_to: input.replyTo,
        tags: input.tags,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      log.warn("Resend API error", { status: res.status, detail: detail.slice(0, 300) });
      return { sent: false, error: `Resend failed (${res.status}): ${detail.slice(0, 200)}` };
    }

    const json = (await res.json()) as { id?: string };
    return { sent: true, id: json.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed";
    log.error("Email send threw", error);
    return { sent: false, error: message };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyHelpdeskTicketCreated(input: {
  ticketNumber: string;
  ticketId: string;
  subject: string;
  requesterName?: string | null;
  requesterEmail?: string | null;
  channel: string;
  body: string;
}): Promise<SendEmailResult> {
  const inbox = helpdeskNotifyEmail();
  if (!inbox) {
    log.warn("HELPDESK_NOTIFY_EMAIL not set — helpdesk create notification skipped", {
      ticketNumber: input.ticketNumber,
    });
    return {
      sent: false,
      error: "HELPDESK_NOTIFY_EMAIL is not configured. Helpdesk was not emailed.",
    };
  }

  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3002";
  const link = `${platformUrl}/helpdesk/${input.ticketId}`;
  const text = [
    `New support ticket ${input.ticketNumber}`,
    `Subject: ${input.subject}`,
    `Channel: ${input.channel}`,
    `From: ${input.requesterName ?? "Unknown"} <${input.requesterEmail ?? "n/a"}>`,
    "",
    input.body,
    "",
    `Open in platform: ${link}`,
  ].join("\n");

  return sendTransactionalEmail({
    to: inbox,
    subject: `[Helpdesk] ${input.ticketNumber}: ${input.subject}`,
    text,
    replyTo: input.requesterEmail ?? undefined,
    tags: [
      { name: "kind", value: "helpdesk_ticket_created" },
      { name: "ticket", value: input.ticketNumber },
    ],
  });
}

export async function notifyHelpdeskAgentReply(input: {
  ticketNumber: string;
  subject: string;
  requesterEmail: string;
  agentName?: string | null;
  body: string;
}): Promise<SendEmailResult> {
  const email = input.requesterEmail.trim();
  if (!email) {
    return { sent: false, error: "Ticket has no requester email." };
  }

  const text = [
    `Update on your support ticket ${input.ticketNumber}`,
    `Subject: ${input.subject}`,
    `Agent: ${input.agentName ?? "Guma support"}`,
    "",
    input.body,
    "",
    "Reply by responding in the same support channel you used to open this ticket.",
  ].join("\n");

  return sendTransactionalEmail({
    to: email,
    subject: `Re: [${input.ticketNumber}] ${input.subject}`,
    text,
    tags: [
      { name: "kind", value: "helpdesk_agent_reply" },
      { name: "ticket", value: input.ticketNumber },
    ],
  });
}
