import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getTenantDashboard,
  recordAiUsage,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";
import { suggestNearbyMarketPrice } from "@/lib/suggest-market-price";

const schema = z.object({
  title: z.string().min(1).max(200),
  currentPrice: z.number().positive().max(999999).optional(),
  productId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = schema.parse(await request.json());

    const quota = await assertAiQuota(session.tenantId, "generation");
    if (!quota.allowed) {
      return NextResponse.json(
        { ok: false, error: quota.reason, upgradeRequired: true, usage: quota.usage },
        { status: 402 }
      );
    }

    const dashboard = await getTenantDashboard(session.tenantId, session.userId);
    if (!dashboard) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const suggestion = suggestNearbyMarketPrice({
      title: body.title,
      category: dashboard.tenant.category,
      currentPrice: body.currentPrice,
    });

    const approvalLevel = resolveApprovalLevel("ai.suggest.pricing", quota.usage.plan);
    const beforeJson = {
      productId: body.productId ?? null,
      title: body.title.trim(),
      basePrice: body.currentPrice ?? null,
    };
    const afterJson = {
      productId: body.productId ?? null,
      title: body.title.trim(),
      basePrice: suggestion.basePrice,
      compareAtPrice: suggestion.compareAtPrice,
      low: suggestion.low,
      high: suggestion.high,
      rationale: suggestion.rationale,
    };

    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "pricing",
      scope: "ai.suggest.pricing",
      approvalLevel,
      proposedByType: "ai",
      proposedByUserId: session.userId,
      summary: `Nearby market price: ${body.title.trim()} → ₱${suggestion.basePrice}`.slice(0, 255),
      beforeJson,
      afterJson,
    });

    await recordAiUsage(session.tenantId, {
      incrementGenerations: true,
      tokensUsed: 40,
    });

    return NextResponse.json({
      ok: true,
      changeRequestId: changeRequest.id,
      approvalLevel,
      requiresReview: approvalLevel !== "automatic",
      before: beforeJson,
      suggestion: afterJson,
    });
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
    console.error("[products/suggest-market-price POST]", error);
    return NextResponse.json({ ok: false, error: "Could not suggest a price." }, { status: 500 });
  }
}
