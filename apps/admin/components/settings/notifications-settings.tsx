"use client";

import { useEffect, useState } from "react";
import { SettingsShell } from "@/components/settings/settings-shell";
import {
  SettingsActions,
  SettingsCard,
  useTenantSettings,
} from "@/components/settings/settings-forms";

const TOGGLES = [
  {
    key: "emailOnNewOrder" as const,
    title: "Email me when a new order arrives",
    description: "Sent to your account email with order details and customer contact info.",
    group: "seller",
  },
  {
    key: "smsOnNewOrder" as const,
    title: "SMS me for new orders",
    description: "Instant text alert when a customer places an order (Pro plan).",
    group: "seller",
  },
  {
    key: "emailOnOrderStatus" as const,
    title: "Email customers when order status changes",
    description: "Customers receive updates when you mark an order as preparing, shipped, or delivered.",
    group: "customer",
  },
  {
    key: "marketingEmails" as const,
    title: "Send occasional promo emails to customers",
    description: "Opt-in marketing messages about sales and new products (requires customer consent).",
    group: "customer",
  },
];

export function NotificationsSettingsPage() {
  const { settings, loading, saving, error, saved, save } = useTenantSettings();
  const [emailOnNewOrder, setEmailOnNewOrder] = useState(true);
  const [smsOnNewOrder, setSmsOnNewOrder] = useState(false);
  const [emailOnOrderStatus, setEmailOnOrderStatus] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setEmailOnNewOrder(settings.settings.notifications?.emailOnNewOrder ?? true);
    setSmsOnNewOrder(settings.settings.notifications?.smsOnNewOrder ?? false);
    setEmailOnOrderStatus(settings.settings.notifications?.emailOnOrderStatus ?? true);
    setMarketingEmails(settings.settings.notifications?.marketingEmails ?? false);
  }, [settings]);

  const values = {
    emailOnNewOrder,
    smsOnNewOrder,
    emailOnOrderStatus,
    marketingEmails,
  };

  const setters = {
    emailOnNewOrder: setEmailOnNewOrder,
    smsOnNewOrder: setSmsOnNewOrder,
    emailOnOrderStatus: setEmailOnOrderStatus,
    marketingEmails: setMarketingEmails,
  };

  if (loading) {
    return <SettingsShell title="Notifications" description="Loading…">…</SettingsShell>;
  }

  return (
    <SettingsShell
      title="Notifications"
      description="Choose how you and your customers get order updates."
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        <SettingsCard title="Seller alerts">
          {TOGGLES.filter((toggle) => toggle.group === "seller").map((toggle) => (
            <label key={toggle.key} className="flex gap-3 rounded-xl border border-gray-100 p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={values[toggle.key]}
                onChange={(e) => setters[toggle.key](e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{toggle.title}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{toggle.description}</span>
              </span>
            </label>
          ))}
        </SettingsCard>

        <SettingsCard title="Customer updates">
          {TOGGLES.filter((toggle) => toggle.group === "customer").map((toggle) => (
            <label key={toggle.key} className="flex gap-3 rounded-xl border border-gray-100 p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={values[toggle.key]}
                onChange={(e) => setters[toggle.key](e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{toggle.title}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{toggle.description}</span>
              </span>
            </label>
          ))}
        </SettingsCard>

        <SettingsActions
          saving={saving}
          saved={saved}
          onSave={() =>
            save({
              settings: {
                notifications: values,
              },
            })
          }
        />
      </div>
    </SettingsShell>
  );
}
