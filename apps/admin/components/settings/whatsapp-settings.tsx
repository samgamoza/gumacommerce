"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, MessageCircle } from "lucide-react";
import { Badge, Button } from "@guma-commerce/ui";
import { SettingsShell } from "@/components/settings/settings-shell";
import {
  SettingsActions,
  SettingsCard,
  SettingsField,
  inputClassName,
  textareaClassName,
  useTenantSettings,
} from "@/components/settings/settings-forms";
import { storefrontUrl } from "@/lib/utils";

function whatsappUrl(phone: string, text?: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const url = new URL(`https://wa.me/${digits}`);
  if (text?.trim()) url.searchParams.set("text", text.trim());
  return url.toString();
}

function formatConnectedDate(iso?: string): string {
  if (!iso) return "Just connected";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WhatsappSettingsPage() {
  const { settings, loading, saving, error, saved, save } = useTenantSettings();
  const [enabled, setEnabled] = useState(false);
  const [phone, setPhone] = useState("");
  const [greeting, setGreeting] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.settings.whatsapp?.enabled ?? false);
    setPhone(settings.settings.whatsapp?.phone ?? "");
    setGreeting(
      settings.settings.whatsapp?.greeting ??
        "Hi! Thanks for messaging us. Place your order here:"
    );
  }, [settings]);

  const shopLink = settings?.slug ? storefrontUrl(settings.slug) : "";
  const previewMessage = useMemo(() => {
    const linkLine = shopLink ? `\n\n${shopLink}` : "";
    return `${greeting.trim()}${linkLine}`;
  }, [greeting, shopLink]);

  const chatUrl = whatsappUrl(phone, previewMessage);
  const connectedAt = settings?.settings.whatsapp?.connectedAt;
  const isConnected = enabled && Boolean(phone.trim());

  async function handleSave() {
    const ok = await save({
      settings: {
        whatsapp: { enabled, phone, greeting },
      },
    });
    if (ok) setEditing(false);
  }

  async function handleDisconnect() {
    setEnabled(false);
    await save({
      settings: {
        whatsapp: { enabled: false, phone, greeting },
      },
    });
    setEditing(false);
  }

  if (loading) {
    return <SettingsShell title="WhatsApp Agent" description="Loading…">…</SettingsShell>;
  }

  return (
    <SettingsShell
      title="WhatsApp Agent"
      description="Auto-reply with your shop link when customers message on WhatsApp."
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {isConnected && !editing ? (
          <SettingsCard title="Connected agent">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{phone}</p>
                    <Badge className="bg-emerald-100 text-emerald-800">Connected</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Active since {formatConnectedDate(connectedAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {chatUrl && (
                  <a
                    href={chatUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    Open conversation
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                )}
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={saving}>
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Auto-reply preview
              </p>
              <div className="mt-3 max-w-md rounded-2xl rounded-bl-sm bg-card p-4 text-sm text-foreground shadow-sm">
                {previewMessage}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Shown on your storefront as a chat button
              </p>
            </div>
          </SettingsCard>
        ) : (
          <SettingsCard title="WhatsApp business">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enable WhatsApp auto-reply agent
            </label>
            <SettingsField label="WhatsApp number" hint="Include country code, e.g. +639171234567">
              <input
                className={inputClassName()}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63..."
              />
            </SettingsField>
            <SettingsField label="Greeting message">
              <textarea
                className={textareaClassName()}
                rows={4}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
              />
            </SettingsField>
            {shopLink && (
              <p className="text-xs text-muted-foreground">
                Your shop link <span className="font-medium">{shopLink}</span> is appended
                automatically.
              </p>
            )}

            <div className="rounded-2xl border border-dashed border-border bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{previewMessage}</p>
            </div>
          </SettingsCard>
        )}

        <SettingsActions saving={saving} saved={saved} onSave={handleSave} />
      </div>
    </SettingsShell>
  );
}
