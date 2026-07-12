import { serve } from "inngest/next";
import { inngest, inngestFunctions } from "@guma-commerce/events";
import { ensureEventsWired } from "@/lib/events-bootstrap";

ensureEventsWired();

/**
 * Inngest serve endpoint.
 * Local: npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
 * Prod: set INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
