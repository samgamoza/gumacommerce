import { NextResponse } from "next/server";
import {
  integrationHealthPayload,
  logIntegrationStatusOnce,
} from "@guma-commerce/services";

export const dynamic = "force-dynamic";

/**
 * Integration posture for MVP release hardening.
 * Never returns secret values — only configured / missing / mock_allowed.
 */
export async function GET() {
  logIntegrationStatusOnce();
  const payload = integrationHealthPayload();
  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
