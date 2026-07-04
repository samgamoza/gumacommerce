import { NextResponse } from "next/server";
import { activateTenantShop } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function POST() {
  try {
    const session = await requireTenantSession();
    const result = await activateTenantShop(session.tenantId, session.userId);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Your shop is now live!" });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[shop/activate POST]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
