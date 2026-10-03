import { NextResponse } from "next/server";
import { addOptOut } from "@gumakart/db";
import { clientIpFrom, rateLimit, verifyOptOutToken } from "@gumakart/services";

/**
 * Buyer opted out from the link in a reminder SMS. A POST (from the page's
 * button), never a GET — SMS apps fetch links for previews, and a preview must
 * not unsubscribe anyone. Platform-wide, marketing only (decisions D2/D3):
 * order updates keep coming.
 */
export async function POST(request: Request) {
  const limited = await rateLimit(`sms-opt-out:${clientIpFrom(request)}`, {
    limit: 20,
    windowSeconds: 60,
  });
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const back = new URL(`/stop/${encodeURIComponent(token)}`, request.url);

  if (!limited.allowed) {
    back.searchParams.set("error", "busy");
    return NextResponse.redirect(back, 303);
  }
  const phone = verifyOptOutToken(token);
  if (!phone) {
    back.searchParams.set("error", "invalid");
    return NextResponse.redirect(back, 303);
  }
  await addOptOut({ phone, channel: "sms", scope: "marketing", tenantId: null, source: "STOP" });
  back.searchParams.set("done", "1");
  return NextResponse.redirect(back, 303);
}
