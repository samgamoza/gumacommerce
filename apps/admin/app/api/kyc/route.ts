import { NextResponse } from "next/server";
import {
  getLatestKycSession,
  getOrCreateActiveKycSession,
  getTenantSettings,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";
import { adminBaseUrl, kycMobileUrl } from "@/lib/kyc-url";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const [kycSession, settings] = await Promise.all([
      getLatestKycSession(session.tenantId),
      getTenantSettings(session.tenantId),
    ]);

    const verified = settings?.settings?.wallet?.kycVerified === true;

    return NextResponse.json({
      ok: true,
      verified,
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
