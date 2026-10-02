import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getWalletSummary,
  requestTenantPayout,
  resolveWalletSettings,
  getTenantSettings,
  WalletError,
  processQueuedPayouts,
} from "@gumakart/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

// Money only goes to the destination saved in Wallet settings — a request body
// can't redirect a payout to some other account.
const payoutSchema = z.object({
  amount: z.number().min(100).max(999999),
});

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = payoutSchema.parse(await request.json());

    const settings = await getTenantSettings(session.tenantId);
    const walletSettings = resolveWalletSettings(
      (settings?.settings ?? {}) as unknown as Record<string, unknown>
    );

    const method = walletSettings.payoutMethod;
    const destinationAccount = walletSettings.payoutAccount;
    const destinationName = walletSettings.payoutAccountName;

    if (!method || !destinationAccount || !destinationName) {
      return NextResponse.json(
        {
          ok: false,
          error: "Add a payout destination in Wallet settings before requesting funds.",
        },
        { status: 400 }
      );
    }

    const amountCentavos = Math.round(body.amount * 100);
    const { payoutId } = await requestTenantPayout({
      tenantId: session.tenantId,
      amountCentavos,
      method,
      destinationAccount,
      destinationName,
    });

    await processQueuedPayouts(1);

    const summary = await getWalletSummary(session.tenantId);
    return NextResponse.json({ ok: true, payoutId, summary });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof WalletError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("[wallet/payout POST]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
