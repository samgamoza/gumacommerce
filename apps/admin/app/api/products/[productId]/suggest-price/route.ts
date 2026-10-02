import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveApprovalLevel } from "@gumakart/ai";
import {
  createChangeRequest,
  getProductForTenant,
  getTenantDashboard,
  recordAiUsage,
} from "@gumakart/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";
import { suggestNearbyMarketPrice } from "@/lib/suggest-market-price";

const idSchema = z.string().uuid();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { productId } = await params;
    const id = idSchema.parse(productId);

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

    const product = await getProductForTenant(session.tenantId, id);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }

    const currentPrice = Number(product.basePrice);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      return NextResponse.json({ ok: false, error: "Product has no valid price." }, { status: 400 });
    }

    const suggestion = suggestNearbyMarketPrice({
      title: product.title,
      category: dashboard.tenant.category,
      currentPrice,
    });
    const approvalLevel = resolveApprovalLevel("ai.suggest.pricing", quota.usage.plan);

    const beforeJson = {
      productId: product.id,
      title: product.title,
      basePrice: currentPrice,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    };
    const afterJson = {
      productId: product.id,
      title: product.title,
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
      summary: `Nearby market price: ${product.title} → ₱${suggestion.basePrice}`.slice(0, 255),
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
      return NextResponse.json({ ok: false, error: "Invalid product id." }, { status: 400 });
    }
    console.error("[products/suggest-price POST]", error);
    return NextResponse.json({ ok: false, error: "Could not suggest a price." }, { status: 500 });
  }
}
