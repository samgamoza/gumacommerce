"use client";

import { useCallback, useEffect, useState } from "react";
import type { KycSessionRecord } from "@guma-commerce/db";
import { KycVerificationFlow } from "@/components/settings/kyc-verification-flow";

export default function KycMobileClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<KycSessionRecord | null>(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/kyc/session", {
      headers: { "x-kyc-token": token },
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "This verification link is invalid or expired.");
      return;
    }
    setSession(data.session);
    if (data.session.status === "approved") setVerified(true);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Guma Commerce
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Identity verification</h1>
          <p className="mt-2 text-sm text-gray-600">
            Take photos of your valid IDs and a selfie on this device.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : verified ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Verification complete</p>
            <p className="mt-1">You can close this page and return to your dashboard.</p>
          </div>
        ) : session ? (
          <KycVerificationFlow
            initialSession={session}
            kycToken={token}
            onVerified={() => {
              setVerified(true);
              void load();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
