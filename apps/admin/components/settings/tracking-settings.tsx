"use client";



import { useEffect, useState } from "react";

import { CheckCircle2 } from "lucide-react";

import { Badge } from "@guma-commerce/ui";

import { SettingsShell } from "@/components/settings/settings-shell";

import {

  SettingsActions,

  SettingsCard,

  SettingsField,

  inputClassName,

  useTenantSettings,

} from "@/components/settings/settings-forms";



function TrackingStatus({ active, label }: { active: boolean; label: string }) {

  return (

    <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3">

      <span className="text-sm font-medium text-foreground">{label}</span>

      {active ? (

        <Badge className="gap-1 bg-emerald-100 text-emerald-800">

          <CheckCircle2 className="h-3 w-3" />

          Active

        </Badge>

      ) : (

        <Badge className="bg-muted text-muted-foreground">Not connected</Badge>

      )}

    </div>

  );

}



export function TrackingSettingsPage() {

  const { settings, loading, saving, error, saved, save } = useTenantSettings();

  const [facebookPixelId, setFacebookPixelId] = useState("");

  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");

  const [tiktokPixelId, setTiktokPixelId] = useState("");



  useEffect(() => {

    if (!settings) return;

    setFacebookPixelId(settings.settings.tracking?.facebookPixelId ?? "");

    setGoogleAnalyticsId(settings.settings.tracking?.googleAnalyticsId ?? "");

    setTiktokPixelId(settings.settings.tracking?.tiktokPixelId ?? "");

  }, [settings]);



  if (loading) {

    return <SettingsShell title="Tracking" description="Loading…">…</SettingsShell>;

  }



  const savedTracking = settings?.settings.tracking;



  return (

    <SettingsShell

      title="Tracking"

      description="Connect ad pixels and analytics to measure storefront traffic and conversions."

    >

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}



      <div className="space-y-4">

        <SettingsCard title="Live status">

          <p className="text-sm text-muted-foreground">

            Pixels load on your public shop pages after you save valid IDs below.

          </p>

          <div className="space-y-2">

            <TrackingStatus

              active={Boolean(savedTracking?.facebookPixelId?.trim())}

              label="Facebook Pixel"

            />

            <TrackingStatus

              active={Boolean(savedTracking?.googleAnalyticsId?.trim())}

              label="Google Analytics"

            />

            <TrackingStatus

              active={Boolean(savedTracking?.tiktokPixelId?.trim())}

              label="TikTok Pixel"

            />

          </div>

        </SettingsCard>



        <SettingsCard title="Ad & analytics IDs">

          <SettingsField label="Facebook Pixel ID">

            <input

              className={inputClassName()}

              value={facebookPixelId}

              onChange={(e) => setFacebookPixelId(e.target.value)}

              placeholder="1234567890"

            />

          </SettingsField>

          <SettingsField label="Google Analytics ID" hint="e.g. G-XXXXXXXXXX">

            <input

              className={inputClassName()}

              value={googleAnalyticsId}

              onChange={(e) => setGoogleAnalyticsId(e.target.value)}

              placeholder="G-XXXXXXXXXX"

            />

          </SettingsField>

          <SettingsField label="TikTok Pixel ID">

            <input

              className={inputClassName()}

              value={tiktokPixelId}

              onChange={(e) => setTiktokPixelId(e.target.value)}

              placeholder="CXXXXXXXXXXXXXXX"

            />

          </SettingsField>

        </SettingsCard>



        <SettingsActions

          saving={saving}

          saved={saved}

          onSave={() =>

            save({

              settings: {

                tracking: { facebookPixelId, googleAnalyticsId, tiktokPixelId },

              },

            })

          }

        />

      </div>

    </SettingsShell>

  );

}

