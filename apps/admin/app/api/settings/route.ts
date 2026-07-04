import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantSettings, updateTenantSettings } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  legalName: z.string().max(255).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  localeDefault: z.enum(["en", "fil", "taglish"]).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(64).optional(),
  tagline: z.string().max(160).optional(),
  promoTitle: z.string().max(120).optional(),
  promoSubtitle: z.string().max(160).optional(),
  subscriptionPlan: z.enum(["free", "growth", "pro"]).optional(),
  settings: z
    .object({
      codEnabled: z.boolean().optional(),
      autoAcceptOrders: z.boolean().optional(),
      minOrderAmount: z.number().min(0).max(999999).optional(),
      delivery: z
        .object({
          provider: z.enum(["lalamove", "grab", "manual"]).optional(),
          flatRate: z.number().min(0).max(99999).optional(),
          freeDeliveryMin: z.number().min(0).max(999999).optional(),
          pickupEnabled: z.boolean().optional(),
          deliveryNotes: z.string().max(500).optional(),
        })
        .optional(),
      notifications: z
        .object({
          emailOnNewOrder: z.boolean().optional(),
          smsOnNewOrder: z.boolean().optional(),
          emailOnOrderStatus: z.boolean().optional(),
          marketingEmails: z.boolean().optional(),
        })
        .optional(),
      whatsapp: z
        .object({
          enabled: z.boolean().optional(),
          phone: z.string().max(20).optional(),
          greeting: z.string().max(500).optional(),
        })
        .optional(),
      tracking: z
        .object({
          facebookPixelId: z.string().max(64).optional(),
          googleAnalyticsId: z.string().max(64).optional(),
          tiktokPixelId: z.string().max(64).optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const session = await requireTenantSession();
    const settings = await getTenantSettings(session.tenantId);
    if (!settings) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[settings GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = patchSchema.parse(await request.json());
    const updated = await updateTenantSettings(session.tenantId, body);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, settings: updated });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("[settings PATCH]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
