import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveApprovalLevel } from "@guma-commerce/ai";
import {
  createChangeRequest,
  getProductForTenant,
  getTenantDashboard,
  recordAiUsage,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { assertAiQuota } from "@/lib/agents/usage-gate";

const idSchema = z.string().uuid();

function suggestPrice(current: number, category: string | null): {
  basePrice: number;
  compareAtPrice: number;
  rationale: string;
} {
  const cat = (category ?? "").toLowerCase();
  // Light category-aware bump — keeps PH peso prices round and reviewable.
  const factor = /print|signage|auto|hvac|aircon|service/.test(cat)
    ? 1.12
    : /food|bakery|grocery|organic/.test(cat)
      ? 1.08
      : 1.1;
  const raw = Math.max(current * factor, current + 20);
  const basePrice = Math.round(raw / 10) * 10;
  const compareAtPrice = Math.round((basePrice * 1.2) / 10) * 10;
  return {
    basePrice,
    compareAtPrice,
    rationale: `Suggested +${Math.round((factor - 1) * 100)}% vs current for ${
      category ?? "your"
    } category, with a compare-at for promo framing.`,
  };
}

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

    const suggestion = suggestPrice(currentPrice, dashboard.tenant.category);
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
      rationale: suggestion.rationale,
    };

    const changeRequest = await createChangeRequest({
      tenantId: session.tenantId,
      domain: "pricing",
      scope: "ai.suggest.pricing",
      approvalLevel,
      proposedByType: "ai",
      proposedByUserId: session.userId,
      summary: `AI price suggestion: ${product.title} → ₱${suggestion.basePrice}`.slice(0, 255),
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
