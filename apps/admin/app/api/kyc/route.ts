import { NextResponse } from "next/server";
import { getLatestKycSession, getOrCreateActiveKycSession } from "@gumakart/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { adminBaseUrl, kycMobileUrl } from "@/lib/kyc-url";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const kycSession = await getLatestKycSession(session.tenantId);

    // The session row is the source of truth; only a platform reviewer can
    // move it to "approved".
    const status = kycSession?.status ?? "none";
    const verified = status === "approved";

    return NextResponse.json({
      ok: true,
      verified,
      status,
      rejectionReason: status === "rejected" ? kycSession?.rejectionReason ?? null : null,
      session: kycSession,
      mobileBaseUrl: adminBaseUrl(),
      mobileUrl: kycSession ? kycMobileUrl(kycSession.token) : null,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[kyc GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await requireTenantSession();
    const kycSession = await getOrCreateActiveKycSession(session.tenantId);
    const mobileUrl = `${adminBaseUrl()}/kyc/mobile/${kycSession.token}`;

    return NextResponse.json({
      ok: true,
      session: kycSession,
      mobileUrl,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[kyc POST]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
