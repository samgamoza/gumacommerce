import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiGenerator } from "@guma-commerce/ai";
import {
  getTenantIdBySlug,
  getTenantStorefrontBySlug,
  recordAiUsage,
  resolveShopAssistantSettings,
  saveShopChatMessage,
} from "@guma-commerce/db";
import { resolveShopTheme } from "@guma-commerce/storefront-themes";
import { assertAiQuota } from "@/lib/ai-quota";

const chatSchema = z.object({
  tenantSlug: z.string().min(1),
  sessionId: z.string().min(8).max(64),
  message: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = chatSchema.parse(await request.json());
    const tenant = await getTenantStorefrontBySlug(body.tenantSlug);
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const assistant = resolveShopAssistantSettings(
      tenant.settingsJson as Record<string, unknown>
    );
    if (!assistant.enabled) {
      return NextResponse.json({ ok: false, error: "Assistant disabled." }, { status: 403 });
    }

    const tenantId = await getTenantIdBySlug(body.tenantSlug);
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const quota = await assertAiQuota(tenantId, "chat");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: quota.reason,
          reply: "Our shop assistant is resting for today. Please browse products or message us on WhatsApp!",
        },
        { status: 429 }
      );
    }

    await saveShopChatMessage({
      tenantId,
      sessionId: body.sessionId,
      role: "user",
      content: body.message,
    });

    const theme = resolveShopTheme(tenant.themeJson, tenant.name);
    const storefrontBase = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";
    const orderLink = `${storefrontBase}/${tenant.slug}?utm_source=shop_assistant`;

    const productSummary = tenant.products
      .filter((p) => p.status === "active")
      .slice(0, 8)
      .map(
        (p) =>
          `- ${p.title}: ₱${Number(p.basePrice).toLocaleString("en-PH")}${p.compareAtPrice ? ` (was ₱${Number(p.compareAtPrice).toLocaleString("en-PH")})` : ""}`
      )
      .join("\n");

    const settings = tenant.settingsJson ?? {};
    const cod = settings.codEnabled !== false ? "COD available" : "COD not available";
    const deliveryNotes = settings.delivery?.deliveryNotes ?? "";
    const minOrder = settings.minOrderAmount ? `Min order ₱${settings.minOrderAmount}` : "";

    const generator = createAiGenerator();
    const result = await generator.generate({
      templateKey: "support_chatbot",
      userPrompt: `Customer question: ${body.message}

Shop: ${tenant.name}
Tagline: ${theme.tagline}
Products:
${productSummary || "- Ask seller for latest menu"}

Payment: GCash, Maya, QRPh${settings.codEnabled !== false ? ", COD" : ""}
Delivery: ${deliveryNotes || "Metro Manila / seller-defined area"}
${minOrder}
${cod}

Reply helpfully in ${assistant.tone}. Keep under 120 words. Include order link when relevant.`,
      subscriptionPlan: tenant.subscriptionPlan,
      taskType: "chat",
      seller: {
        brandName: tenant.name,
        category: tenant.category ?? "General",
        location: "Philippines",
        tone: assistant.tone,
        audience: "Shop visitors before checkout",
        orderLink,
      },
    });

    const output = result.output as Record<string, unknown>;
    const reply =
      (typeof output.reply === "string" && output.reply) ||
      "Thanks for your message! Browse our products and tap Checkout when ready.";

    await saveShopChatMessage({
      tenantId,
      sessionId: body.sessionId,
      role: "assistant",
      content: reply,
    });

    await recordAiUsage(tenantId, { tokensUsed: result.tokensUsed });

    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    console.error("Shop chat error:", error);
    return NextResponse.json({ ok: false, error: "Chat failed." }, { status: 400 });
  }
}
