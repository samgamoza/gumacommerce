"use client";

import { useCallback, useEffect, useState } from "react";
import type { KycSessionRecord } from "@guma-commerce/db";
import { KycVerificationFlow } from "@/components/settings/kyc-verification-flow";
import { SettingsPageLayout } from "@/components/settings/settings-shell";
import { SettingsCard } from "@/components/settings/settings-forms";

export function KycSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [session, setSession] = useState<KycSessionRecord | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/kyc");
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "Could not load verification status.");
      return;
    }
    setVerified(data.verified === true);
    setSession(data.session ?? null);
    setMobileUrl(data.mobileUrl ?? null);
    if (
      data.session &&
      ["draft", "in_progress"].includes(data.session.status) &&
      !data.verified
    ) {
      setShowFlow(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startVerification() {
    setStarting(true);
    setError(null);
    const res = await fetch("/api/kyc", { method: "POST" });
    const data = await res.json();
    setStarting(false);
    if (!data.ok) {
      setError(data.error ?? "Could not start verification.");
      return;
    }
    setSession(data.session);
    setMobileUrl(data.mobileUrl ?? null);
    setShowFlow(true);
  }

  function handleVerified() {
    setVerified(true);
    setShowFlow(false);
    void load();
  }

  return (
    <SettingsPageLayout
      title="KYC verification"
      description="Verify your identity to unlock wallet payouts. Use one primary ID or two secondary IDs accepted in the Philippines."
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <SettingsCard title="Verification status">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : verified ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Verified</p>
            <p className="mt-1">Your account is cleared for wallet payouts.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Not verified yet</p>
            <p className="mt-1 text-amber-800/90">
              Submit a valid Philippine ID to receive wallet payouts.
            </p>
          </div>
        )}

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>
            • <strong>Option A:</strong> 1 primary ID (Passport, Driver&apos;s License, UMID,
            National ID, PRC, or Postal ID)
          </li>
          <li>
            • <strong>Option B:</strong> 2 secondary IDs (SSS, PhilHealth, TIN, Barangay ID,
            company/school ID, clearances, etc.)
          </li>
          <li>• Selfie holding your ID (required for both options)</li>
          <li>• Desktop without a camera? Scan a QR code to finish on your phone.</li>
        </ul>

        {!verified && !showFlow ? (
          <button
            type="button"
            onClick={startVerification}
            disabled={starting}
            className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {starting ? "Starting…" : "Start verification"}
          </button>
        ) : null}
      </SettingsCard>

      {!verified && showFlow && session ? (
        <SettingsCard title="Complete verification">
          <KycVerificationFlow
            initialSession={session}
            mobileUrl={mobileUrl ?? undefined}
            onVerified={handleVerified}
          />
        </SettingsCard>
      ) : null}
    </SettingsPageLayout>
  );
}
