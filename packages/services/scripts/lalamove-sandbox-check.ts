/**
 * Lalamove SANDBOX webhook check (plan §3.1 #3).
 *
 * Proves our webhook signature check matches what Lalamove really sends:
 *   1. registers your webhook URL with the Lalamove sandbox,
 *   2. books a sandbox delivery (Makati → BGC, no real rider, no charge),
 *   3. cancels it after a few seconds so Lalamove sends a status webhook.
 * Then check the web app logs for:
 *   "Lalamove webhook signature verified" { variant: "…" }   → set LALAMOVE_WEBHOOK_VARIANT to that value
 *   "Invalid Lalamove webhook signature"                       → send me the log line
 *
 * Run (from the repo root, with sandbox keys in .env and the web app deployed):
 *   pnpm --filter @gumakart/services lalamove:check -- https://<web host>/api/webhooks/lalamove
 *
 * Never runs against production: LALAMOVE_ENV must be "sandbox" (the default).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLalamoveClient } from "../src/delivery/lalamove";

/** Minimal .env loader (repo root .env.local, then .env); real env vars win. */
function loadEnv() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]!] !== undefined) continue;
      process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

async function main() {
  const webhookUrl = process.argv.slice(2).find((a) => a.startsWith("https://"));
  if (!webhookUrl) {
    console.error("Usage: lalamove:check -- https://<web host>/api/webhooks/lalamove");
    process.exit(1);
  }
  if ((process.env.LALAMOVE_ENV ?? "sandbox") !== "sandbox") {
    console.error("Refusing to run: LALAMOVE_ENV is not 'sandbox'.");
    process.exit(1);
  }
  if (!process.env.LALAMOVE_API_KEY || !process.env.LALAMOVE_API_SECRET) {
    console.error("Set LALAMOVE_API_KEY and LALAMOVE_API_SECRET (sandbox keys).");
    process.exit(1);
  }

  const client = createLalamoveClient();

  console.log(`1/3 Registering webhook → ${webhookUrl}`);
  await client.setWebhookUrl(webhookUrl);

  console.log("2/3 Booking a sandbox delivery (Makati → BGC)…");
  const quote = await client.getQuotation({
    pickup: { address: "Ayala Ave, Makati, Metro Manila", coordinates: { lat: "14.5547", lng: "121.0244" } },
    dropoff: { address: "5th Ave, BGC, Taguig, Metro Manila", coordinates: { lat: "14.5509", lng: "121.0510" } },
  });
  if (quote.mock) throw new Error("Got a mock quotation — check the keys.");
  const booking = await client.bookDelivery({
    quotationId: quote.quotationId,
    stopIds: quote.stopIds,
    recipientName: "Guma Kart Sandbox Test",
    recipientPhone: "+639171234567",
    senderName: "Guma Kart Sandbox Test",
    senderPhone: "+639171234567",
    remarks: "Sandbox webhook check — please ignore",
  });
  console.log(`   booked ${booking.orderId} (${booking.status}), fee ₱${quote.fee}`);

  await new Promise((r) => setTimeout(r, 5000));
  console.log("3/3 Cancelling it so Lalamove sends a status webhook…");
  await client.cancelOrder(booking.orderId);

  console.log("\nDone. Within a minute, check the web logs for 'Lalamove webhook signature verified'.");
  console.log("The order isn't linked to a Guma order, so the webhook is acknowledged and ignored after the check.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
