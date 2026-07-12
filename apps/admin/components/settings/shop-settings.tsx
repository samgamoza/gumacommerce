"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { ExternalLink } from "lucide-react";

import { SettingsShell } from "@/components/settings/settings-shell";

import {

  SettingsActions,

  SettingsCard,

  SettingsField,

  inputClassName,

  useTenantSettings,

} from "@/components/settings/settings-forms";

import { storefrontUrl } from "@/lib/utils";
import { SHOP_BUSINESS_CATEGORIES } from "@guma-commerce/storefront-themes";



export function ShopSettingsPage() {

  const { settings, loading, saving, error, saved, save } = useTenantSettings();

  const [name, setName] = useState("");

  const [legalName, setLegalName] = useState("");

  const [category, setCategory] = useState("");

  const [tagline, setTagline] = useState("");

  const [promoTitle, setPromoTitle] = useState("");

  const [promoSubtitle, setPromoSubtitle] = useState("");

  const [localeDefault, setLocaleDefault] = useState("taglish");

  const [currency, setCurrency] = useState("PHP");

  const [timezone, setTimezone] = useState("Asia/Manila");



  useEffect(() => {

    if (!settings) return;

    setName(settings.name);

    setLegalName(settings.legalName ?? "");

    setCategory(settings.category ?? "");

    setTagline(settings.themeJson?.tagline ?? "");

    setPromoTitle(settings.themeJson?.promoTitle ?? "");

    setPromoSubtitle(settings.themeJson?.promoSubtitle ?? "");

    setLocaleDefault(settings.localeDefault ?? "taglish");

    setCurrency(settings.currency);

    setTimezone(settings.timezone);

  }, [settings]);



  if (loading) return <SettingsShell title="Shop" description="Loading…">…</SettingsShell>;



  return (

    <SettingsShell

      title="Shop"

      description="Basic shop identity shown on your storefront and order receipts."

    >

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}



      <div className="space-y-4">

        <SettingsCard title="Store details">

          <SettingsField label="Shop name">

            <input className={inputClassName()} value={name} onChange={(e) => setName(e.target.value)} />

          </SettingsField>

          <SettingsField label="Legal name" hint="Optional — for invoices and BIR records.">

            <input

              className={inputClassName()}

              value={legalName}

              onChange={(e) => setLegalName(e.target.value)}

            />

          </SettingsField>

          <SettingsField label="Business category">
            <select
              className={inputClassName()}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {!SHOP_BUSINESS_CATEGORIES.includes(
                category as (typeof SHOP_BUSINESS_CATEGORIES)[number]
              ) &&
                category && (
                  <option value={category}>{category}</option>
                )}
              {SHOP_BUSINESS_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField label="Tagline" hint="Shown under your shop name on the storefront.">

            <input

              className={inputClassName()}

              value={tagline}

              onChange={(e) => setTagline(e.target.value)}

            />

          </SettingsField>

          <SettingsField label="Shop URL" hint="Contact support to change your URL slug.">

            <input className={inputClassName()} value={settings?.slug ?? ""} readOnly disabled />

          </SettingsField>

          {settings?.slug && (

            <Link

              href={storefrontUrl(settings.slug)}

              target="_blank"

              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900"

            >

              View live shop

              <ExternalLink className="h-3.5 w-3.5" />

            </Link>

          )}

        </SettingsCard>



        <SettingsCard title="Storefront promo banner">

          <SettingsField label="Promo headline" hint="Shown on your shop homepage.">

            <input

              className={inputClassName()}

              value={promoTitle}

              onChange={(e) => setPromoTitle(e.target.value)}

              placeholder="Free delivery on orders ₱500+"

            />

          </SettingsField>

          <SettingsField label="Promo subtext">

            <input

              className={inputClassName()}

              value={promoSubtitle}

              onChange={(e) => setPromoSubtitle(e.target.value)}

              placeholder="Order before 8 PM for same-day delivery"

            />

          </SettingsField>

        </SettingsCard>



        <SettingsCard title="Regional">

          <SettingsField label="Default language">

            <select

              className={inputClassName()}

              value={localeDefault}

              onChange={(e) => setLocaleDefault(e.target.value)}

            >

              <option value="taglish">Taglish</option>

              <option value="en">English</option>

              <option value="fil">Filipino</option>

            </select>

          </SettingsField>

          <SettingsField label="Currency">

            <input className={inputClassName()} value={currency} onChange={(e) => setCurrency(e.target.value)} />

          </SettingsField>

          <SettingsField label="Timezone">

            <input className={inputClassName()} value={timezone} onChange={(e) => setTimezone(e.target.value)} />

          </SettingsField>

        </SettingsCard>



        <SettingsActions

          saving={saving}

          saved={saved}

          onSave={() =>

            save({

              name,

              legalName: legalName || null,

              category: category || null,

              tagline,

              promoTitle,

              promoSubtitle,

              localeDefault: localeDefault as "en" | "fil" | "taglish",

              currency,

              timezone,

            })

          }

        />

      </div>

    </SettingsShell>

  );

}

