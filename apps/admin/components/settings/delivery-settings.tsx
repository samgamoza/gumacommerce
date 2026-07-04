"use client";

import { useEffect, useMemo, useState } from "react";
import { SettingsShell } from "@/components/settings/settings-shell";
import {
  SettingsActions,
  SettingsCard,
  SettingsField,
  inputClassName,
  textareaClassName,
  useTenantSettings,
} from "@/components/settings/settings-forms";

function previewDeliveryFee(subtotal: number, flatRate: number, freeDeliveryMin: number): number {
  if (freeDeliveryMin > 0 && subtotal >= freeDeliveryMin) return 0;
  return flatRate;
}

function providerLabel(provider: string): string {
  if (provider === "lalamove") return "Lalamove delivery";
  if (provider === "grab") return "GrabExpress delivery";
  return "Delivery fee";
}

export function DeliverySettingsPage() {
  const { settings, loading, saving, error, saved, save } = useTenantSettings();
  const [codEnabled, setCodEnabled] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [minOrderAmount, setMinOrderAmount] = useState("99");
  const [provider, setProvider] = useState("manual");
  const [flatRate, setFlatRate] = useState("0");
  const [freeDeliveryMin, setFreeDeliveryMin] = useState("500");
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  useEffect(() => {
    if (!settings) return;
    setCodEnabled(settings.settings.codEnabled ?? true);
    setAutoAcceptOrders(settings.settings.autoAcceptOrders ?? false);
    setMinOrderAmount(String(settings.settings.minOrderAmount ?? 99));
    setProvider(settings.settings.delivery?.provider ?? "manual");
    setFlatRate(String(settings.settings.delivery?.flatRate ?? 0));
    setFreeDeliveryMin(String(settings.settings.delivery?.freeDeliveryMin ?? 500));
    setPickupEnabled(settings.settings.delivery?.pickupEnabled ?? true);
    setDeliveryNotes(settings.settings.delivery?.deliveryNotes ?? "");
  }, [settings]);

  const previewSubtotal = 499;
  const previewFee = useMemo(
    () =>
      previewDeliveryFee(
        previewSubtotal,
        Number(flatRate) || 0,
        Number(freeDeliveryMin) || 0
      ),
    [flatRate, freeDeliveryMin]
  );

  if (loading) {
    return (
      <SettingsShell title="Delivery & Shipping" description="Loading…">
        …
      </SettingsShell>
    );
  }

  return (
    <SettingsShell
      title="Delivery & Shipping"
      description="Configure how customers pay and receive orders."
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        <SettingsCard title="Checkout preview">
          <p className="text-sm text-gray-600">
            Based on a sample order of ₱{previewSubtotal}, customers will see:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>
              • {codEnabled ? "COD available" : "COD hidden"} · Min order ₱
              {Number(minOrderAmount) || 0}
            </li>
            <li>
              • {providerLabel(provider)}: ₱{previewFee}
              {previewFee === 0 && Number(freeDeliveryMin) > 0
                ? ` (free above ₱${freeDeliveryMin})`
                : ""}
            </li>
            <li>• {pickupEnabled ? "Store pickup offered" : "Delivery only"}</li>
            {deliveryNotes && <li>• Note: {deliveryNotes}</li>}
          </ul>
        </SettingsCard>

        <SettingsCard title="Payments & orders">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} />
            Accept Cash on Delivery (COD)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoAcceptOrders}
              onChange={(e) => setAutoAcceptOrders(e.target.checked)}
            />
            Auto-accept new orders
          </label>
          <SettingsField label="Minimum order amount (₱)">
            <input
              type="number"
              min="0"
              className={inputClassName()}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
            />
          </SettingsField>
        </SettingsCard>

        <SettingsCard title="Delivery">
          <SettingsField label="Delivery provider">
            <select
              className={inputClassName()}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="manual">Manual / in-house</option>
              <option value="lalamove">Lalamove</option>
              <option value="grab">GrabExpress</option>
            </select>
          </SettingsField>
          <SettingsField label="Flat delivery fee (₱)">
            <input
              type="number"
              min="0"
              className={inputClassName()}
              value={flatRate}
              onChange={(e) => setFlatRate(e.target.value)}
            />
          </SettingsField>
          <SettingsField label="Free delivery above (₱)">
            <input
              type="number"
              min="0"
              className={inputClassName()}
              value={freeDeliveryMin}
              onChange={(e) => setFreeDeliveryMin(e.target.value)}
            />
          </SettingsField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={(e) => setPickupEnabled(e.target.checked)}
            />
            Allow store pickup
          </label>
          <SettingsField label="Delivery notes for customers">
            <textarea
              className={textareaClassName()}
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Metro Manila only · 1–3 PM delivery window"
            />
          </SettingsField>
        </SettingsCard>

        <SettingsActions
          saving={saving}
          saved={saved}
          onSave={() =>
            save({
              settings: {
                codEnabled,
                autoAcceptOrders,
                minOrderAmount: Number(minOrderAmount) || 0,
                delivery: {
                  provider: provider as "lalamove" | "grab" | "manual",
                  flatRate: Number(flatRate) || 0,
                  freeDeliveryMin: Number(freeDeliveryMin) || 0,
                  pickupEnabled,
                  deliveryNotes,
                },
              },
            })
          }
        />
      </div>
    </SettingsShell>
  );
}
