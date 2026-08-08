"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { PlatformOpsSettings, PlatformPaymentsMode, TriFlag } from "@guma-commerce/db";
import { updatePlatformSettingsAction } from "@/app/actions";
import { Panel, SectionHeader } from "@/components/ui";

type EnvStatus = {
  key: string;
  label: string;
  configured: boolean;
  detail?: string;
};

type IntegrationRow = {
  id: string;
  label: string;
  status: string;
  message: string;
  severity: string;
};

const TRI_OPTIONS: { value: TriFlag; label: string }[] = [
  { value: "inherit", label: "Inherit from env" },
  { value: "true", label: "Force on" },
  { value: "false", label: "Force off" },
];

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
      aria-hidden
    />
  );
}

export function SettingsPanel({
  initial,
  envFlags,
  publicUrls,
  providerKeys,
  integrations,
  activeLandingLabel,
}: {
  initial: PlatformOpsSettings;
  envFlags: { softLaunch: boolean; freeTemplateSwitch: boolean; requiresUpgrade: boolean; paymentsMode: string };
  publicUrls: { storefront: string; admin: string; platform: string };
  providerKeys: EnvStatus[];
  integrations: IntegrationRow[];
  activeLandingLabel: string;
}) {
  const [softLaunch, setSoftLaunch] = useState<TriFlag>(initial.softLaunch);
  const [freeTemplateSwitch, setFreeTemplateSwitch] = useState<TriFlag>(
    initial.freeTemplateSwitch
  );
  const [templateSwitchRequiresUpgrade, setTemplateSwitchRequiresUpgrade] = useState<TriFlag>(
    initial.templateSwitchRequiresUpgrade
  );
  const [paymentsMode, setPaymentsMode] = useState<PlatformPaymentsMode | "">(
    initial.paymentsMode
  );
  const [helpdeskNotifyEmail, setHelpdeskNotifyEmail] = useState(initial.helpdeskNotifyEmail);
  const [supportContactEmail, setSupportContactEmail] = useState(initial.supportContactEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePlatformSettingsAction({
        softLaunch,
        freeTemplateSwitch,
        templateSwitchRequiresUpgrade,
        paymentsMode,
        helpdeskNotifyEmail,
        supportContactEmail,
      });
      if (!result.ok) {
        setMessage(result.error ?? "Save failed.");
        return;
      }
      setMessage("Saved. Soft-launch and payments overrides apply on the next request.");
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${
            message.startsWith("Saved")
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {message}
        </p>
      )}

      <Panel>
        <SectionHeader title="Soft launch & feature flags" />
        <p className="mb-4 text-sm text-muted-foreground">
          Stored in the database and override host env when set to Force on/off. Use{" "}
          <span className="font-medium text-foreground">Inherit</span> to keep CT{" "}
          <code className="text-xs">.env</code> in control.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FlagSelect
            label="Soft launch"
            hint={`Env GUMA_SOFT_LAUNCH is ${envFlags.softLaunch ? "on" : "off"}`}
            value={softLaunch}
            onChange={setSoftLaunch}
          />
          <FlagSelect
            label="Free template switch"
            hint={`Env GUMA_FREE_TEMPLATE_SWITCH is ${envFlags.freeTemplateSwitch ? "on" : "off"}`}
            value={freeTemplateSwitch}
            onChange={setFreeTemplateSwitch}
          />
          <FlagSelect
            label="Require upgrade to switch"
            hint={`Env GUMA_TEMPLATE_SWITCH_REQUIRES_UPGRADE is ${
              envFlags.requiresUpgrade ? "on" : "off"
            }`}
            value={templateSwitchRequiresUpgrade}
            onChange={setTemplateSwitchRequiresUpgrade}
          />
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Payments mode (platform default)" />
        <p className="mb-3 text-sm text-muted-foreground">
          Global default for shops with no per-tenant override. PayMongo activation is Platform-only —
          sellers only manage receiving account numbers. Per-shop overrides live on Tenants → shop →
          Admin actions. Env <code className="text-xs">PAYMENTS_MODE</code> is currently{" "}
          <span className="font-medium text-foreground">{envFlags.paymentsMode}</span>.
        </p>
        <select
          className="w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm"
          value={paymentsMode}
          onChange={(e) => setPaymentsMode(e.target.value as PlatformPaymentsMode | "")}
        >
          <option value="">Inherit from env ({envFlags.paymentsMode})</option>
          <option value="manual_ewallet">Manual e-wallet (GCash / Maya / bank)</option>
          <option value="paymongo">PayMongo only</option>
          <option value="both">Both (PayMongo when configured)</option>
        </select>
      </Panel>

      <Panel>
        <SectionHeader title="Support contact" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium">Helpdesk notify email</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              New tickets email this inbox. Overrides HELPDESK_NOTIFY_EMAIL when set.
            </p>
            <input
              type="email"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2"
              value={helpdeskNotifyEmail}
              onChange={(e) => setHelpdeskNotifyEmail(e.target.value)}
              placeholder="ops@guma.one"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Public support contact</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Shown to ops as the seller-facing contact (stored for future surfaces).
            </p>
            <input
              type="email"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2"
              value={supportContactEmail}
              onChange={(e) => setSupportContactEmail(e.target.value)}
              placeholder="support@guma.one"
            />
          </label>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        <p className="text-xs text-muted-foreground">Changes are audited in Audit Log.</p>
      </div>

      <Panel>
        <SectionHeader
          title="Public URLs"
          action={
            <Link href="/frontends" className="text-xs font-semibold text-sky-700 underline">
              Manage landing →
            </Link>
          }
        />
        <p className="mb-3 text-sm text-muted-foreground">
          From host env (build/runtime). Active homepage:{" "}
          <span className="font-medium text-foreground">{activeLandingLabel}</span>.
        </p>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <UrlRow label="Storefront" value={publicUrls.storefront} />
          <UrlRow label="Admin" value={publicUrls.admin} />
          <UrlRow label="Platform (ops)" value={publicUrls.platform} />
        </dl>
      </Panel>

      <Panel>
        <SectionHeader title="AI & provider keys" />
        <p className="mb-3 text-sm text-muted-foreground">
          Secrets stay in <code className="text-xs">.env</code> — this only shows configured vs
          missing (Template Intel AI skins use Gemini Flash when present).
        </p>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {providerKeys.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <StatusDot ok={row.configured} />
                <span className="font-medium">{row.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{row.key}</span>
              </div>
              <span className={row.configured ? "text-emerald-700" : "text-amber-700"}>
                {row.configured ? "Configured" : "Missing"}
                {row.detail ? ` · ${row.detail}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <SectionHeader title="Integrations health" />
        <ul className="divide-y divide-border rounded-xl border border-border">
          {integrations.map((row) => {
            const ok = row.status === "configured" || row.status === "mock_allowed";
            return (
              <li key={row.id} className="px-3 py-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusDot ok={ok} />
                    <span className="font-medium">{row.label}</span>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {row.severity}
                    </span>
                  </div>
                  <span className="capitalize text-muted-foreground">{row.status.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{row.message}</p>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function FlagSelect({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: TriFlag;
  onChange: (v: TriFlag) => void;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium">{label}</span>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      <select
        className="mt-1.5 w-full rounded-lg border border-border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value as TriFlag)}
      >
        {TRI_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UrlRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-xs text-foreground" title={value}>
        {value}
      </dd>
    </div>
  );
}
