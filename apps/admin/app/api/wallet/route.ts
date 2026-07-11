import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTenantSettings,
  getWalletSummary,
  listTenantPayouts,
  listWalletLedger,
  resolveWalletSettings,
  updateTenantSettings,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const [summary, ledger, payouts, tenantSettings] = await Promise.all([
      getWalletSummary(session.tenantId),
      listWalletLedger(session.tenantId),
      listTenantPayouts(session.tenantId),
      getTenantSettings(session.tenantId),
    ]);

    const walletSettings = resolveWalletSettings(
      (tenantSettings?.settings ?? {}) as unknown as Record<string, unknown>
    );

    return NextResponse.json({
      ok: true,
      summary,
      ledger,
      payouts,
      walletSettings,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[wallet GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

const patchSchema = z.object({
  autoPayoutEnabled: z.boolean().optional(),
  payoutMethod: z.enum(["gcash", "maya", "bank"]).optional(),
  payoutAccount: z.string().min(5).max(64).optional(),
  payoutAccountName: z.string().min(2).max(120).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = patchSchema.parse(await request.json());
    const updated = await updateTenantSettings(session.tenantId, {
      settings: { wallet: body },
    });
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }
    const walletSettings = resolveWalletSettings(
      (updated.settings ?? {}) as unknown as Record<string, unknown>
    );
    return NextResponse.json({ ok: true, walletSettings });
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
    console.error("[wallet PATCH]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
