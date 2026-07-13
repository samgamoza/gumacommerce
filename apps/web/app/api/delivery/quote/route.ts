import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantStorefrontBySlug } from "@guma-commerce/db";
import { resolveShippingFee } from "@guma-commerce/db/shipping";
import { clientIpFrom, rateLimit } from "@guma-commerce/services";
import { getLalamoveCheckoutQuote } from "@/lib/delivery-quote";
import {
  computeDeliveryFee,
  resolveStorefrontSettings,
} from "@/lib/storefront-settings";

const quoteSchema = z.object({
  tenantSlug: z.string().min(1).max(64),
  address: z.string().trim().min(10).max(500),
  /** Cart subtotal in PHP, used only for the flat-rate fallback. */
  subtotal: z.number().min(0).max(9999999).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(`delivery-quote:${clientIpFrom(request)}`, {
      limit: 20,
      windowSeconds: 60,
    });
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Too many quote requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

    const body = quoteSchema.parse(await request.json());
    const tenant = await getTenantStorefrontBySlug(body.tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const settings = resolveStorefrontSettings(
      tenant.settingsJson,
      tenant.currency ?? "PHP",
      tenant.checkoutPublishedJson,
      tenant.shippingPublishedJson
    );
    const quote = await getLalamoveCheckoutQuote(settings, body.address);

    if (quote) {
      return NextResponse.json({
        ok: true,
        live: true,
        provider: "lalamove",
        fee: quote.fee,
        etaMinutes: quote.etaMinutes ?? null,
      });
    }

    const fee = computeDeliveryFee(body.subtotal ?? 0, settings);
    const resolved = resolveShippingFee({
      shipping: settings.shipping,
      subtotal: body.subtotal ?? 0,
    });

    return NextResponse.json({
      ok: true,
      live: false,
      provider: settings.delivery.provider,
      fee,
      etaMinutes: resolved.etaMinutes?.max ?? resolved.etaMinutes?.min ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("Delivery quote error:", error);
    return NextResponse.json({ error: "Quote failed" }, { status: 400 });
  }
}
