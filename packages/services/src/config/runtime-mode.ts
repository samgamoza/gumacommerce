/**
 * Runtime mode helpers for MVP release hardening.
 *
 * - development: explicit mocks allowed when credentials are missing
 * - test: deterministic mock adapters allowed
 * - production: never silently mock — missing credentials must fail
 */

export type RuntimeMode = "development" | "test" | "production";

export function getRuntimeMode(): RuntimeMode {
  if (process.env.NODE_ENV === "test" || process.env.GUMA_TEST_ADAPTERS === "true") {
    return "test";
  }

  // Vercel sets NODE_ENV=production on Preview too — use VERCEL_ENV for truth.
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV) {
    return "production";
  }

  return "development";
}

export function isProductionRuntime(): boolean {
  return getRuntimeMode() === "production";
}

/**
 * Whether integration clients may return labeled mock responses.
 *
 * Production: always false (even if GUMA_ALLOW_INTEGRATION_MOCKS is set).
 * Test: always true.
 * Development: true unless GUMA_ALLOW_INTEGRATION_MOCKS=false.
 */
export function allowIntegrationMocks(): boolean {
  const mode = getRuntimeMode();
  if (mode === "production") return false;
  if (mode === "test") return true;
  return process.env.GUMA_ALLOW_INTEGRATION_MOCKS !== "false";
}
