"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsPageLayout } from "@/components/settings/settings-shell";
import { SettingsCard } from "@/components/settings/settings-forms";

type Receiving = {
  gcashNumber: string;
  gcashName: string;
  mayaNumber: string;
  mayaName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
};

export function PaymentsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"manual_ewallet" | "paymongo" | "both">("manual_ewallet");
  const [receiving, setReceiving] = useState<Receiving>({
    gcashNumber: "",
    gcashName: "",
    mayaNumber: "",
    mayaName: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings");
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "Could not load settings.");
      return;
    }
    const payments = data.settings?.settings?.payments ?? {};
    setMode(payments.mode ?? "manual_ewallet");
    setReceiving({
      gcashNumber: payments.receiving?.gcashNumber ?? "",
      gcashName: payments.receiving?.gcashName ?? "",
      mayaNumber: payments.receiving?.mayaNumber ?? "",
      mayaName: payments.receiving?.mayaName ?? "",
      bankName: payments.receiving?.bankName ?? "",
      bankAccountName: payments.receiving?.bankAccountName ?? "",
      bankAccountNumber: payments.receiving?.bankAccountNumber ?? "",
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          payments: { mode, receiving },
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setError(data.error ?? "Save failed.");
      return;
    }
    setMessage("Payment receiving accounts saved.");
  }

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <SettingsPageLayout
      title="Payments (MVP)"
      description="Direct GCash / Maya / bank transfer until PayMongo is enabled. Buyers pay your number; you confirm in Orders."
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <SettingsCard title="Mode">
        <p className="mb-2 text-sm text-muted-foreground">
          Beta default bypasses PayMongo.
        </p>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          className="h-10 w-full max-w-md rounded-lg border px-3 text-sm"
        >
          <option value="manual_ewallet">Direct e-wallet (recommended for beta)</option>
          <option value="both">Both (PayMongo when keys exist, else direct)</option>
          <option value="paymongo">PayMongo only</option>
        </select>
      </SettingsCard>

      <SettingsCard title="GCash receiving">
        <p className="mb-2 text-sm text-muted-foreground">
          Shown to buyers at checkout / order tracking.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Account name
            <input
              className="mt-1 h-10 w-full rounded-lg border px-3"
              value={receiving.gcashName}
              onChange={(e) => setReceiving((r) => ({ ...r, gcashName: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Mobile number
            <input
              className="mt-1 h-10 w-full rounded-lg border px-3"
              value={receiving.gcashNumber}
              onChange={(e) => setReceiving((r) => ({ ...r, gcashNumber: e.target.value }))}
              placeholder="09XXXXXXXXX"
            />
          </label>
        </div>
      </SettingsCard>

      <SettingsCard title="Maya receiving">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Account name
            <input
              className="mt-1 h-10 w-full rounded-lg border px-3"
              value={receiving.mayaName}
              onChange={(e) => setReceiving((r) => ({ ...r, mayaName: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Mobile number
            <input
              className="mt-1 h-10 w-full rounded-lg border px-3"
              value={receiving.mayaNumber}
              onChange={(e) => setReceiving((r) => ({ ...r, mayaNumber: e.target.value }))}
              placeholder="09XXXXXXXXX"
            />
          </label>
        </div>
      </SettingsCard>

      <SettingsCard title="Bank (optional)">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Bank name
            <input
              className="mt-1 h-10 w-full rounded-lg border px-3"
              value={receiving.bankName}
              onChange={(e) => setReceiving((r) => ({ ...r, bankName: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Account name
            <input
              className="mt-1 h-10 w-full rounded-lg border px-3"
              value={receiving.bankAccountName}
              onChange={(e) => setReceiving((r) => ({ ...r, bankAccountName: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Account number
            <input
              className="mt-1 h-10 w-full rounded-lg border px-3"
              value={receiving.bankAccountNumber}
              onChange={(e) =>
                setReceiving((r) => ({ ...r, bankAccountNumber: e.target.value }))
              }
            />
          </label>
        </div>
      </SettingsCard>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save payment settings"}
      </button>
    </SettingsPageLayout>
  );
}
