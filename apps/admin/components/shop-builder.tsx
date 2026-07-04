"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card } from "@guma-commerce/ui";
import type { ResolvedShopTheme } from "@guma-commerce/storefront-themes";

interface TemplateOption {
  id: string;
  label: string;
  description: string;
  mood: string;
  tags: string[];
  previewGradient: string;
  minPlan: string;
  locked: boolean;
}

interface TemplateTier {
  tier: "basic" | "standard" | "advanced";
  label: string;
  description: string;
  templates: TemplateOption[];
}

interface ShopUrls {
  storefront: string;
  preview: string;
}

function ShopPreviewMock({
  shopName,
  theme,
}: {
  shopName: string;
  theme: ResolvedShopTheme;
}) {
  const isDark = theme.mode === "dark";

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-inner"
      style={{
        background: theme.background,
        color: theme.foreground,
        borderColor: theme.border,
      }}
    >
      <div
        className="relative h-28 px-4 pt-4"
        style={{
          background:
            theme.hero === "mesh" || theme.hero === "chrome"
              ? theme.previewGradient
              : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              theme.hero === "noise"
                ? "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.8), transparent 40%)"
                : undefined,
          }}
        />
        <div className="relative flex items-end gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center border-4 text-2xl shadow-lg"
            style={{
              borderRadius: theme.radius,
              borderColor: isDark ? theme.foreground : "#fff",
              backgroundColor: theme.cardBackground,
            }}
          >
            🛍️
          </div>
          <div className="pb-1">
            <p className="text-sm font-bold">{shopName}</p>
            <p className="text-[10px] opacity-80">{theme.tagline}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}22, ${theme.accentColor}33)`,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
          }}
        >
          <p className="font-semibold">{theme.promoTitle}</p>
          <p className="mt-1 opacity-75">{theme.promoSubtitle}</p>
        </div>

        <div className={theme.card === "grid" || theme.layout === "bento" ? "grid grid-cols-2 gap-2" : "space-y-2"}>
          {[1, 2].map((item) => (
            <div
              key={item}
              className="flex gap-2 p-2"
              style={{
                background: theme.cardBackground,
                border:
                  theme.card === "brutal"
                    ? `2px solid ${theme.foreground}`
                    : `1px solid ${theme.border}`,
                borderRadius: theme.card === "brutal" ? "0.5rem" : theme.radius,
                boxShadow: theme.card === "glass-tile" ? "0 8px 32px rgba(0,0,0,0.08)" : undefined,
              }}
            >
              <div
                className="h-10 w-10 shrink-0"
                style={{
                  borderRadius: theme.radius,
                  background: `linear-gradient(135deg, ${theme.primaryColor}55, ${theme.accentColor}88)`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className="h-2 w-3/4 rounded"
                  style={{ backgroundColor: theme.foreground, opacity: 0.15 }}
                />
                <div
                  className="mt-2 h-2 w-1/3 rounded"
                  style={{ backgroundColor: theme.primaryColor, opacity: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ShopBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [shopName, setShopName] = useState("My Shop");
  const [tiers, setTiers] = useState<TemplateTier[]>([]);
  const [urls, setUrls] = useState<ShopUrls | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [selectedTemplateId, setSelectedTemplateId] = useState("clean-sari");
  const [tagline, setTagline] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoSubtitle, setPromoSubtitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [previewTheme, setPreviewTheme] = useState<ResolvedShopTheme | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [shopRes, templatesRes] = await Promise.all([
      fetch("/api/shop"),
      fetch("/api/shop/templates"),
    ]);

    const shopData = await shopRes.json();
    const templatesData = await templatesRes.json();
    setLoading(false);

    if (!shopData.ok) {
      setError(shopData.error ?? "Could not load shop settings.");
      return;
    }

    if (templatesData.ok) {
      setTiers(templatesData.tiers);
      setSubscriptionPlan(templatesData.subscriptionPlan ?? "free");
      setSelectedTemplateId(templatesData.currentTemplateId ?? "clean-sari");
    }

    setShopName(shopData.shop.tenant.name);
    setUrls(shopData.urls);
    setPreviewTheme(shopData.theme);
    setTagline(shopData.theme.tagline ?? "");
    setPromoTitle(shopData.theme.promoTitle ?? "");
    setPromoSubtitle(shopData.theme.promoSubtitle ?? "");
    setPrimaryColor(shopData.theme.primaryColor ?? "#059669");
    setAccentColor(shopData.theme.accentColor ?? "#f59e0b");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const livePreviewTheme = useMemo<ResolvedShopTheme | null>(() => {
    if (!previewTheme) return null;
    return {
      ...previewTheme,
      tagline: tagline || previewTheme.tagline,
      promoTitle: promoTitle || previewTheme.promoTitle,
      promoSubtitle: promoSubtitle || previewTheme.promoSubtitle,
      primaryColor,
      accentColor,
    };
  }, [previewTheme, tagline, promoTitle, promoSubtitle, primaryColor, accentColor]);

  async function selectTemplate(template: TemplateOption) {
    if (template.locked) {
      setError("This template is on a higher plan. Starter includes Basic; upgrade for Standard & Advanced.");
      return;
    }

    setError(null);
    setSaved(false);
    setSelectedTemplateId(template.id);

    const res = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id }),
    });
    const data = await res.json();

    if (!data.ok) {
      setError(data.error ?? "Could not apply template.");
      return;
    }

    setPreviewTheme(data.theme);
    setPrimaryColor(data.theme.primaryColor);
    setAccentColor(data.theme.accentColor);
  }

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tagline,
        promoTitle,
        promoSubtitle,
        primaryColor,
        accentColor,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!data.ok) {
      setError(data.error ?? "Could not save shop design.");
      return;
    }

    setPreviewTheme(data.theme);
    setSaved(true);
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading shop builder…</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <h2 className="text-lg font-semibold">Shop Builder</h2>
              <Badge className="bg-emerald-100 text-emerald-800">New</Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Pick a storefront template from Basic to Advanced. Each design changes layout,
              typography, cards, and hero style — so every shop feels unique, not just the URL.
            </p>
          </div>
          {urls && (
            <a
              href={urls.preview}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Open live preview ↗
            </a>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Plan: <span className="font-medium capitalize">{subscriptionPlan}</span> · Basic templates
          included free · Standard & Advanced unlock with Growth / Pro
        </p>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Shop design saved.</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {tiers.map((tier) => (
            <section key={tier.tier}>
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900">{tier.label}</h3>
                <p className="text-sm text-gray-500">{tier.description}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {tier.templates.map((template) => {
                  const selected = selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      disabled={template.locked}
                      onClick={() => selectTemplate(template)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-emerald-500 bg-white ring-2 ring-emerald-500"
                          : template.locked
                            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
                            : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="mb-3 h-24 rounded-xl"
                        style={{ background: template.previewGradient }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{template.label}</p>
                        {selected && <Badge>Active</Badge>}
                        {template.locked && <Badge className="bg-gray-100 text-gray-600">Pro</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        {template.mood}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Customize copy & colors</h3>
            <p className="mt-1 text-sm text-gray-500">
              Fine-tune your tagline, promo banner, and brand colors on top of the template.
            </p>
            <form onSubmit={handleSaveDetails} className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-medium text-gray-600">Shop tagline</span>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Premium cakes, made to order 🎂"
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Promo headline</span>
                <input
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Promo subtext</span>
                <input
                  value={promoSubtitle}
                  onChange={(e) => setPromoSubtitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Primary color</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Accent color</span>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2"
                />
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save customization"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Card className="p-4">
            <p className="mb-3 text-sm font-medium text-gray-900">Live preview</p>
            {livePreviewTheme && (
              <ShopPreviewMock shopName={shopName} theme={livePreviewTheme} />
            )}
            <p className="mt-3 text-xs text-gray-500">
              Your customers see the full layout on mobile — cards, hero, and header all change
              with the template you pick.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
