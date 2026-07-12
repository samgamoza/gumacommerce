import { Inngest } from "inngest";

/**
 * Shared Inngest client. Works without keys in local/dev — send() is a no-op
 * unless INNGEST_EVENT_KEY is configured. Handlers still run via the serve route
 * when the Inngest Dev Server or cloud is connected.
 */
export const inngest = new Inngest({
  id: "guma-commerce",
  name: "GUMA ai-Commerce",
});

export function isInngestConfigured(): boolean {
  return Boolean(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV);
}
