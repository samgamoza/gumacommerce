"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@guma-commerce/ui";

interface CheckoutDraft {
  codEnabled?: boolean;
  minOrderAmount?: number;
  autoAcceptOrders?: boolean;
  tax?: { enabled?: boolean; ratePercent?: number; inclusive?: boolean };
  coupons?: Array<{
    code: string;
    type: "percent" | "fixed";
    value: number;
    minSubtotal?: number;
    active?: boolean;
  }>;
  paymentAdapters?: {
    cod?: boolean;
    paymongo?: { gcash?: boolean; paymaya?: boolean; qrph?: boolean; card?: boolean };
  };
  customer?: { requireEmail?: boolean; requireStructuredAddress?: boolean };
  abandonedAfterMinutes?: number;
  rationale?: string;
}

const EMPTY: CheckoutDraft = {
  codEnabled: true,
  minOrderAmount: 99,
  autoAcceptOrders: false,
  tax: { enabled: false, ratePercent: 12, inclusive: false },
  coupons: [],
  paymentAdapters: {
    cod: true,
    paymongo: { gcash: true, paymaya: true, qrph: true, card: false },
  },
  customer: { requireEmail: false, requireStructuredAddress: false },
  abandonedAfterMinutes: 60,
};

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm";

export function WorkspaceCheckout() {
  const [draft, setDraft] = useState<CheckoutDraft>(EMPTY);
  const [published, setPublished] = useState<CheckoutDraft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [couponText, setCouponText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout");
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not load checkout");
        return;
      }
      setDraft(data.draft ?? EMPTY);
      setPublished(data.published ?? EMPTY);
      setCouponText(
        (data.draft?.coupons ?? [])
          .map(
            (c: { code: string; type: string; value: number }) =>
              `${c.code}:${c.type === "fixed" ? "₱" : ""}${c.value}${
                c.type === "percent" ? "%" : ""
              }`
          )
          .join(", ")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function parseCoupons(text: string) {
    return text
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [codeRaw, rest] = part.split(":");
        const code = (codeRaw ?? "").trim().toUpperCase();
        if (!code) return null;
        const valuePart = (rest ?? "10").trim();
        const percent = valuePart.endsWith("%");
        const value = Number(valuePart.replace(/[₱%]/g, ""));
        if (!Number.isFinite(value) || value <= 0) return null;
        return {
          code,
          type: (percent ? "percent" : "fixed") as "percent" | "fixed",
          value,
          active: true,
        };
      })
      .filter(Boolean) as NonNullable<CheckoutDraft["coupons"]>;
  }

  function payloadFromDraft() {
    return {
      ...draft,
      coupons: parseCoupons(couponText),
    };
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft()),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setDraft(data.draft);
      setNotice("Draft saved. Submit for approval to publish live.");
    } finally {
      setSaving(false);
    }
  }

  async function suggestAi() {
    setBusy("suggest");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/checkout/suggest", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Suggest failed");
        return;
      }
      setDraft(data.suggestion);
      setCouponText(
        (data.suggestion?.coupons ?? [])
          .map(
            (c: { code: string; type: string; value: number }) =>
              `${c.code}:${c.type === "fixed" ? "₱" : ""}${c.value}${
                c.type === "percent" ? "%" : ""
              }`
          )
          .join(", ")
      );
      setNotice(
        data.requiresReview
          ? "AI draft ready and queued as a change request. Review in Approvals, then publish."
          : "AI draft ready."
      );
    } finally {
      setBusy(null);
    }
  }

  async function submitForApproval() {
    setBusy("submit");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/checkout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout: payloadFromDraft() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Submit failed");
        return;
      }
      setNotice("Submitted for approval. Open Approvals to publish.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading checkout…</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Checkout</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure taxes, coupons, payment adapters, and customer fields. Changes become
          change requests — nothing goes live until you approve &amp; publish in{" "}
          <Link href="/workspace/approvals" className="underline">
            Approvals
          </Link>
          .
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {notice && <p className="mt-3 text-sm text-emerald-700">{notice}</p>}
        {draft.rationale && (
          <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {draft.rationale}
          </p>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Basics
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.codEnabled !== false}
            onChange={(e) => setDraft((d) => ({ ...d, codEnabled: e.target.checked }))}
          />
          Cash on Delivery enabled
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Minimum order (₱)</span>
          <input
            type="number"
            className={inputClass}
            value={draft.minOrderAmount ?? 99}
            onChange={(e) =>
              setDraft((d) => ({ ...d, minOrderAmount: Number(e.target.value) || 0 }))
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">
            Abandoned after (minutes)
          </span>
          <input
            type="number"
            className={inputClass}
            value={draft.abandonedAfterMinutes ?? 60}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                abandonedAfterMinutes: Number(e.target.value) || 60,
              }))
            }
          />
        </label>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Taxes</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.tax?.enabled === true}
            onChange={(e) =>
              setDraft((d) => ({ ...d, tax: { ...d.tax, enabled: e.target.checked } }))
            }
          />
          Collect tax
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Rate %</span>
          <input
            type="number"
            className={inputClass}
            value={draft.tax?.ratePercent ?? 12}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                tax: { ...d.tax, ratePercent: Number(e.target.value) || 0 },
              }))
            }
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.tax?.inclusive === true}
            onChange={(e) =>
              setDraft((d) => ({ ...d, tax: { ...d.tax, inclusive: e.target.checked } }))
            }
          />
          Prices include tax
        </label>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Coupons
        </h3>
        <p className="text-xs text-gray-500">
          Format: <code>WELCOME10:10%</code>, <code>SAVE50:₱50</code> (comma-separated)
        </p>
        <input
          className={inputClass}
          value={couponText}
          onChange={(e) => setCouponText(e.target.value)}
          placeholder="WELCOME10:10%, SAVE50:₱50"
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Payment adapters
        </h3>
        {(
          [
            ["gcash", "GCash (PayMongo)"],
            ["paymaya", "Maya (PayMongo)"],
            ["qrph", "QR Ph (PayMongo)"],
            ["card", "Card (PayMongo)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={
                key === "card"
                  ? draft.paymentAdapters?.paymongo?.card === true
                  : draft.paymentAdapters?.paymongo?.[key] !== false
              }
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  paymentAdapters: {
                    ...d.paymentAdapters,
                    paymongo: {
                      ...d.paymentAdapters?.paymongo,
                      [key]: e.target.checked,
                    },
                  },
                }))
              }
            />
            {label}
          </label>
        ))}
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Customer &amp; address
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.customer?.requireEmail === true}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                customer: { ...d.customer, requireEmail: e.target.checked },
              }))
            }
          />
          Require email
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.customer?.requireStructuredAddress === true}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                customer: { ...d.customer, requireStructuredAddress: e.target.checked },
              }))
            }
          />
          Require city / barangay
        </label>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Published snapshot
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Live min order:{" "}
          <span className="font-medium text-gray-900">
            ₱{published.minOrderAmount ?? "—"} · COD{" "}
            {published.codEnabled !== false ? "on" : "off"}
          </span>
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!!busy || saving}
          onClick={() => void saveDraft()}
        >
          {saving ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!!busy}
          onClick={() => void suggestAi()}
        >
          {busy === "suggest" ? "Suggesting…" : "Suggest with AI"}
        </Button>
        <Button type="button" disabled={!!busy} onClick={() => void submitForApproval()}>
          {busy === "submit" ? "Submitting…" : "Submit for approval"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!!busy}
          onClick={async () => {
            setBusy("abandon");
            try {
              const res = await fetch("/api/checkout/abandon", { method: "POST" });
              const data = await res.json();
              if (!data.ok) {
                setError(data.error ?? "Sweep failed");
                return;
              }
              setNotice(`Marked ${data.abandoned ?? 0} abandoned checkout(s).`);
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === "abandon" ? "Sweeping…" : "Sweep abandoned checkouts"}
        </Button>
        <Link
          href="/workspace/approvals"
          className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Open Approvals
        </Link>
      </div>
    </div>
  );
}
