"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsShell } from "@/components/settings/settings-shell";
import {
  SettingsActions,
  SettingsCard,
  useTenantSettings,
} from "@/components/settings/settings-forms";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

type PushState = "unsupported" | "unavailable" | "off" | "on" | "busy";

function usePushNotifications() {
  const [state, setState] = useState<PushState>("busy");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      try {
        const res = await fetch("/api/push/subscribe");
        const data = await res.json();
        if (!data.ok) {
          setState("unavailable");
          return;
        }
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        setState(subscription ? "on" : "off");
      } catch {
        setState("unavailable");
      }
    })();
  }, []);

  const enable = useCallback(async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("off");
        return;
      }
      const keyRes = await fetch("/api/push/subscribe");
      const keyData = await keyRes.json();
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      const data = await res.json();
      setState(data.ok ? "on" : "off");
    } catch {
      setState("off");
    }
  }, []);

  const disable = useCallback(async () => {
    setState("busy");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }, []);

  return { state, enable, disable };
}

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
  const push = usePushNotifications();
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
        <SettingsCard title="Push notifications">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
            <span>
              <span className="block text-sm font-medium text-foreground">
                Browser push for new orders
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Get an instant notification on this device the moment a payment lands — even
                when the dashboard tab is closed.
              </span>
            </span>
            {push.state === "unsupported" ? (
              <span className="shrink-0 text-xs text-muted-foreground">Not supported here</span>
            ) : push.state === "unavailable" ? (
              <span className="shrink-0 text-xs text-muted-foreground">Not configured</span>
            ) : (
              <button
                type="button"
                onClick={push.state === "on" ? push.disable : push.enable}
                disabled={push.state === "busy"}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  push.state === "on"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-muted text-foreground hover:bg-muted"
                }`}
              >
                {push.state === "busy" ? "…" : push.state === "on" ? "On — tap to turn off" : "Turn on"}
              </button>
            )}
          </div>
        </SettingsCard>

        <SettingsCard title="Seller alerts">
          {TOGGLES.filter((toggle) => toggle.group === "seller").map((toggle) => (
            <label key={toggle.key} className="flex gap-3 rounded-xl border border-border p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={values[toggle.key]}
                onChange={(e) => setters[toggle.key](e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{toggle.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{toggle.description}</span>
              </span>
            </label>
          ))}
        </SettingsCard>

        <SettingsCard title="Customer updates">
          {TOGGLES.filter((toggle) => toggle.group === "customer").map((toggle) => (
            <label key={toggle.key} className="flex gap-3 rounded-xl border border-border p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={values[toggle.key]}
                onChange={(e) => setters[toggle.key](e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{toggle.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{toggle.description}</span>
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
