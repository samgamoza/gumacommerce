"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type {
  TenantPayoutItem,
  TenantWalletSettings,
  TenantWalletSummary,
  WalletLedgerItem,
} from "@guma-commerce/db";
import { SettingsPageLayout } from "@/components/settings/settings-shell";
import { SettingsCard } from "@/components/settings/settings-forms";

function formatPhp(amount: number | string): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return `${account.slice(0, 2)}••••${account.slice(-4)}`;
}

export function WalletSettingsPage() {
  const searchParams = useSearchParams();
  const requestRef = useRef<HTMLDivElement | null>(null);
  const showRequest = searchParams.get("action") === "request";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<TenantWalletSummary | null>(null);
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([]);
  const [payouts, setPayouts] = useState<TenantPayoutItem[]>([]);
  const [walletSettings, setWalletSettings] = useState<TenantWalletSettings>({});
  const [payoutAmount, setPayoutAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/wallet");
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "Could not load wallet.");
      return;
    }
    setSummary(data.summary);
    setLedger(data.ledger ?? []);
    setPayouts(data.payouts ?? []);
    setWalletSettings(data.walletSettings ?? {});
    if (data.summary?.availableBalance) {
      setPayoutAmount(String(Number(data.summary.availableBalance)));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (showRequest) {
      requestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showRequest]);

  async function savePayoutSettings() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/wallet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        autoPayoutEnabled: walletSettings.autoPayoutEnabled ?? false,
        payoutMethod: walletSettings.payoutMethod,
        payoutAccount: walletSettings.payoutAccount,
        payoutAccountName: walletSettings.payoutAccountName,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setError(data.error ?? "Could not save payout settings.");
      return;
    }
    setWalletSettings(data.walletSettings ?? {});
    setMessage("Payout settings saved.");
  }

  async function requestPayout() {
    setRequesting(true);
    setError(null);
    setMessage(null);
    const amount = Number.parseFloat(payoutAmount);
    const res = await fetch("/api/wallet/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setRequesting(false);
    if (!data.ok) {
      setError(data.error ?? "Could not request payout.");
      return;
    }
    setMessage("Payout sent — check your account within 1–2 business days.");
    await load();
  }

  const kycVerified = walletSettings.kycVerified === true;
  const canPayout =
    kycVerified &&
    walletSettings.payoutMethod &&
    walletSettings.payoutAccount &&
    walletSettings.payoutAccountName;
  const available = Number(summary?.availableBalance ?? 0);

  return (
    <SettingsPageLayout
      title="Wallet & payouts"
      description="Sales are credited automatically after payment. Cleared funds can be withdrawn manually or on auto-payout."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading wallet…</p>
      ) : (
        <>
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {message}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <SettingsCard title="Available balance">
              <p className="text-3xl font-bold text-foreground">
                {formatPhp(summary?.availableBalance ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Ready to withdraw</p>
            </SettingsCard>
            <SettingsCard title="Pending clearance">
              <p className="text-3xl font-bold text-foreground">
                {formatPhp(summary?.pendingBalance ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Released on delivery or after ~48 hours
              </p>
            </SettingsCard>
            <SettingsCard title="Total withdrawn">
              <p className="text-3xl font-bold text-foreground">
                {formatPhp(summary?.totalWithdrawn ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Lifetime payouts</p>
            </SettingsCard>
          </div>

          <div className="mt-6">
            <SettingsCard title="Auto-payout">
              <p className="text-sm text-muted-foreground">
                When enabled, cleared balance (₱500 minimum) is automatically sent to your linked
                account on a daily schedule. Platform fee (2.5% + ₱5) is deducted per paid order.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-foreground">Payout method</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                    value={walletSettings.payoutMethod ?? ""}
                    onChange={(e) =>
                      setWalletSettings((s) => ({
                        ...s,
                        payoutMethod: e.target.value as TenantWalletSettings["payoutMethod"],
                      }))
                    }
                  >
                    <option value="">Select…</option>
                    <option value="gcash">GCash</option>
                    <option value="maya">Maya</option>
                    <option value="bank">Bank transfer</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-foreground">Account number</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                    placeholder="09XX XXX XXXX"
                    value={walletSettings.payoutAccount ?? ""}
                    onChange={(e) =>
                      setWalletSettings((s) => ({ ...s, payoutAccount: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-foreground">Account name</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                    placeholder="Name on account"
                    value={walletSettings.payoutAccountName ?? ""}
                    onChange={(e) =>
                      setWalletSettings((s) => ({ ...s, payoutAccountName: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={walletSettings.autoPayoutEnabled === true}
                  onChange={(e) =>
                    setWalletSettings((s) => ({ ...s, autoPayoutEnabled: e.target.checked }))
                  }
                />
                Enable automatic daily payouts when balance reaches ₱500+
              </label>
              <button
                type="button"
                onClick={savePayoutSettings}
                disabled={saving}
                className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save payout settings"}
              </button>
            </SettingsCard>
          </div>

          <div ref={requestRef} className="mt-6">
            <SettingsCard title="Request payout">
              {!kycVerified ? (
                <p className="text-sm text-muted-foreground">
                  Complete{" "}
                  <Link href="/settings/kyc" className="font-medium text-emerald-700 underline">
                    KYC verification
                  </Link>{" "}
                  before your first payout.
                </p>
              ) : !canPayout ? (
                <p className="text-sm text-muted-foreground">
                  Save a payout destination above before requesting funds.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Withdraw to {walletSettings.payoutMethod?.toUpperCase()}{" "}
                    {maskAccount(walletSettings.payoutAccount ?? "")}.
                  </p>
                  <label className="mt-3 block text-sm">
                    <span className="font-medium text-foreground">Amount (PHP)</span>
                    <input
                      type="number"
                      min={100}
                      step={0.01}
                      className="mt-1 w-full max-w-xs rounded-xl border border-border px-3 py-2"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={requestPayout}
                    disabled={requesting || available < 100}
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {requesting ? "Submitting…" : "Request funds"}
                  </button>
                </>
              )}
            </SettingsCard>
          </div>

          <div className="mt-6">
            <SettingsCard title="Recent activity">
              {ledger.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No wallet activity yet. Paid orders will appear here automatically.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {ledger.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start justify-between gap-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {entry.description ?? entry.type.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.createdAt)}
                          {entry.status === "pending" && entry.availableAt
                            ? ` · clears ${formatDate(entry.availableAt)}`
                            : null}
                        </p>
                      </div>
                      <span
                        className={
                          Number(entry.netAmount) >= 0 ? "text-emerald-700" : "text-foreground"
                        }
                      >
                        {Number(entry.netAmount) >= 0 ? "+" : ""}
                        {formatPhp(entry.netAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SettingsCard>
          </div>

          <div className="mt-6">
            <SettingsCard title="Payout history">
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payouts yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {payouts.map((payout) => (
                    <li
                      key={payout.id}
                      className="flex items-start justify-between gap-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {formatPhp(payout.amount)} → {payout.method.toUpperCase()}{" "}
                          {maskAccount(payout.destinationAccount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payout.createdAt)}
                          {payout.autoTriggered ? " · auto" : ""} · {payout.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SettingsCard>
          </div>
        </>
      )}
    </SettingsPageLayout>
  );
}
