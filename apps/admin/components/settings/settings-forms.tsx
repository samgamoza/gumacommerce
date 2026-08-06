"use client";

import { useCallback, useEffect, useState } from "react";
import type { TenantSettingsRecord } from "@guma-commerce/db";
import { Button, Card } from "@guma-commerce/ui";

export function useTenantSettings() {
  const [settings, setSettings] = useState<TenantSettingsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/settings");
    const data = await res.json();
    setLoading(false);
    if (data.ok) setSettings(data.settings);
    else setError(data.error ?? "Could not load settings.");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setError(data.error ?? "Could not save settings.");
      return false;
    }
    setSettings(data.settings);
    setSaved(true);
    return true;
  }

  return { settings, loading, saving, error, saved, save, reload: load };
}

export function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h3 className="font-medium text-foreground">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  );
}

export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </label>
  );
}

export function SettingsActions({
  saving,
  saved,
  onSave,
}: {
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
      {saved && <p className="text-sm text-emerald-700">Saved.</p>}
    </div>
  );
}

export function inputClassName() {
  return "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground";
}

export function textareaClassName() {
  return "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground";
}
