import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTenantStorefrontBySlug,
  upsertCheckoutSession,
} from "@gumakart/db";
import { clientIpFrom, rateLimit } from "@gumakart/services";

const bodySchema = z.object({
  tenantSlug: z.string().min(1).max(64),
  sessionKey: z.string().min(8).max(64),
  cart: z.array(z.record(z.unknown())).max(50).optional(),
  customer: z.record(z.unknown()).optional(),
  address: z.record(z.unknown()).optional(),
  couponCode: z.string().max(64).nullable().optional(),
  smsConsent: z.boolean().optional(),
});

/** Persist cart / checkout progress for abandoned-checkout detection. */
export async function POST(request: Request) {
  const limited = await rateLimit(`checkout-session:${clientIpFrom(request)}`, {
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const tenant = await getTenantStorefrontBySlug(body.tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const session = await upsertCheckoutSession({
      tenantId: tenant.id,
      sessionKey: body.sessionKey,
      cartJson: body.cart,
      customerJson: body.customer,
      addressJson: body.address,
      couponCode: body.couponCode ?? null,
      phone: typeof body.customer?.phone === "string" ? body.customer.phone : null,
      marketingConsent: body.smsConsent,
      sourceChannel: "storefront",
    });

    return NextResponse.json({ ok: true, status: session?.status ?? "active" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid session data." },
        { status: 400 }
      );
    }
    console.error("[checkout-session]", error);
    return NextResponse.json({ error: "Could not save session." }, { status: 500 });
  }
}
