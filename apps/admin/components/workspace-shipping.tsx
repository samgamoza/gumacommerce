"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@guma-commerce/ui";

interface ShippingDraft {
  defaultProfileId?: string;
  profiles?: Array<{
    id: string;
    name: string;
    enabled?: boolean;
    methods?: Array<Record<string, unknown>>;
  }>;
  origin?: { address?: string };
  notes?: string;
  rationale?: string;
}

const EMPTY: ShippingDraft = {
  defaultProfileId: "default",
  profiles: [],
  origin: { address: "" },
  notes: "",
};

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm";
const areaClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm min-h-[72px]";

export function WorkspaceShipping() {
  const [draft, setDraft] = useState<ShippingDraft>(EMPTY);
  const [published, setPublished] = useState<ShippingDraft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [flatRate, setFlatRate] = useState("89");
  const [freeMin, setFreeMin] = useState("500");
  const [provider, setProvider] = useState<"manual" | "lalamove" | "grab">("manual");
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [localRate, setLocalRate] = useState("59");
  const [etaMin, setEtaMin] = useState("45");
  const [etaMax, setEtaMax] = useState("120");
  const [zoneCities, setZoneCities] = useState("Manila, Quezon City, Makati");

  const applyDraftToForm = useCallback((d: ShippingDraft) => {
    setDraft(d);
    const methods = d.profiles?.[0]?.methods ?? [];
    const courier = methods.find((m) => m.type === "courier") as
      | { provider?: string; fallbackFlatRate?: number; freeAboveSubtotal?: number }
      | undefined;
    const flat = methods.find((m) => m.type === "flat") as
      | {
          rates?: Array<{ amount?: number }>;
          freeAboveSubtotal?: number;
          etaMinutes?: { min?: number; max?: number };
          zones?: Array<{ match?: { cities?: string[] } }>;
        }
      | undefined;
    const local = methods.find((m) => m.type === "local_delivery") as
      | { rates?: Array<{ amount?: number }> }
      | undefined;
    const pickup = methods.find((m) => m.type === "pickup") as
      | { enabled?: boolean }
      | undefined;

    if (courier?.provider === "lalamove" || courier?.provider === "grab") {
      setProvider(courier.provider);
      setFlatRate(String(courier.fallbackFlatRate ?? 89));
      setFreeMin(String(courier.freeAboveSubtotal ?? 500));
    } else {
      setProvider("manual");
      setFlatRate(String(flat?.rates?.[0]?.amount ?? 89));
      setFreeMin(String(flat?.freeAboveSubtotal ?? 500));
    }
    setLocalRate(String(local?.rates?.[0]?.amount ?? 59));
    setPickupEnabled(pickup?.enabled !== false);
    setEtaMin(String(flat?.etaMinutes?.min ?? 45));
    setEtaMax(String(flat?.etaMinutes?.max ?? 120));
    setZoneCities((flat?.zones?.[0]?.match?.cities ?? ["Manila", "Quezon City", "Makati"]).join(", "));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shipping");
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not load shipping");
        return;
      }
      applyDraftToForm(data.draft ?? EMPTY);
      setPublished(data.published ?? EMPTY);
    } finally {
      setLoading(false);
    }
  }, [applyDraftToForm]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildPayload(): ShippingDraft {
    const cities = zoneCities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const methods: Array<Record<string, unknown>> = [
      {
        id: "flat-metro",
        type: "flat",
        label: "Standard delivery",
        enabled: provider === "manual",
        zones: [
          {
            id: "zone-primary",
            name: "Primary zone",
            match: { cities },
          },
        ],
        rates: [
          { id: "rate-flat", basis: "flat", amount: Number(flatRate) || 0 },
          {
            id: "rate-price-band",
            basis: "price",
            min: 0,
            max: Math.max(0, (Number(freeMin) || 0) - 1),
            amount: Number(flatRate) || 0,
          },
        ],
        freeAboveSubtotal: Number(freeMin) || 0,
        etaMinutes: { min: Number(etaMin) || 45, max: Number(etaMax) || 120 },
      },
      {
        id: "local-default",
        type: "local_delivery",
        label: "Local delivery",
        enabled: true,
        zones: [],
        rates: [{ id: "rate-local", basis: "flat", amount: Number(localRate) || 0 }],
        freeAboveSubtotal: Number(freeMin) || 0,
        etaMinutes: { min: 30, max: 90 },
      },
      {
        id: "courier-default",
        type: "courier",
        label: provider === "grab" ? "GrabExpress" : "Lalamove",
        enabled: provider !== "manual",
        provider: provider === "manual" ? "lalamove" : provider,
        fallbackFlatRate: Number(flatRate) || 89,
        freeAboveSubtotal: Number(freeMin) || 0,
        etaMinutes: { min: Number(etaMin) || 40, max: Number(etaMax) || 100 },
      },
      {
        id: "pickup-default",
        type: "pickup",
        label: "Store pickup",
        enabled: pickupEnabled,
        instructions: "We'll text you when ready.",
        etaMinutes: { min: 20, max: 45 },
      },
    ];

    return {
      defaultProfileId: "default",
      profiles: [
        {
          id: "default",
          name: "Default",
          enabled: true,
          methods,
        },
      ],
      origin: { address: draft.origin?.address ?? "" },
      notes: draft.notes ?? "",
    };
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      applyDraftToForm(data.draft);
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
      const res = await fetch("/api/shipping/suggest", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Suggest failed");
        return;
      }
      applyDraftToForm(data.suggestion);
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
      const res = await fetch("/api/shipping/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping: buildPayload() }),
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
    return <p className="text-sm text-gray-500">Loading shipping…</p>;
  }

  const publishedMethods = published.profiles?.[0]?.methods?.length ?? 0;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Shipping</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure profiles, zones, rates, couriers, pickup, and ETA. Changes become change
          requests — nothing goes live until you approve &amp; publish in{" "}
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
          Courier &amp; rates
        </h3>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Provider</span>
          <select
            className={inputClass}
            value={provider}
            onChange={(e) =>
              setProvider(e.target.value as "manual" | "lalamove" | "grab")
            }
          >
            <option value="manual">Manual / flat rate</option>
            <option value="lalamove">Lalamove</option>
            <option value="grab">GrabExpress</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Flat / fallback fee (₱)</span>
            <input
              className={inputClass}
              value={flatRate}
              onChange={(e) => setFlatRate(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Free above subtotal (₱)</span>
            <input
              className={inputClass}
              value={freeMin}
              onChange={(e) => setFreeMin(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Local delivery fee (₱)</span>
            <input
              className={inputClass}
              value={localRate}
              onChange={(e) => setLocalRate(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:pt-7">
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={(e) => setPickupEnabled(e.target.checked)}
            />
            Pickup enabled
          </label>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Zone &amp; ETA
        </h3>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">
            Zone cities (comma-separated)
          </span>
          <input
            className={inputClass}
            value={zoneCities}
            onChange={(e) => setZoneCities(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">ETA min (minutes)</span>
            <input className={inputClass} value={etaMin} onChange={(e) => setEtaMin(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">ETA max (minutes)</span>
            <input className={inputClass} value={etaMax} onChange={(e) => setEtaMax(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Pickup / origin address</span>
          <input
            className={inputClass}
            value={draft.origin?.address ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, origin: { ...d.origin, address: e.target.value } }))
            }
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Buyer-facing notes</span>
          <textarea
            className={areaClass}
            value={draft.notes ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
        </label>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Published snapshot
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Live methods:{" "}
          <span className="font-medium text-gray-900">
            {publishedMethods || "(not published yet)"}
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
