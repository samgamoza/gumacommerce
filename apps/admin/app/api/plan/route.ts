import { NextResponse } from "next/server";
import { getTenantDashboard, getTenantStorefrontSettings } from "@guma-commerce/db";
import { PLAN_AI_LIMITS, normalizePlan } from "@guma-commerce/ai";
import { getUsageSnapshot } from "@/lib/agents/usage-gate";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const [usage, storefront, dashboard] = await Promise.all([
      getUsageSnapshot(session.tenantId),
      getTenantStorefrontSettings(session.tenantId),
      getTenantDashboard(session.tenantId, session.userId),
    ]);

    const plan = normalizePlan(storefront?.subscriptionPlan ?? usage.plan);
    const limits = PLAN_AI_LIMITS[plan];

    const generationsLeft = Math.max(
      0,
      limits.generationsPerMonth - usage.generationsThisMonth
    );
    const chatLeft = Math.max(0, limits.chatMessagesPerDay - usage.chatMessagesToday);

    return NextResponse.json({
      ok: true,
      plan,
      planLabel: limits.label,
      usage,
      credits: {
        generationsLeft,
        generationsLimit: limits.generationsPerMonth,
        chatLeft,
        chatLimit: limits.chatMessagesPerDay,
      },
      tenant: {
        name: session.tenantName,
        slug: session.tenantSlug,
        status: dashboard?.tenant.status ?? "pending",
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[plan GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
