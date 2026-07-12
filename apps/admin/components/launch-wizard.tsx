"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { Button, Card } from "@guma-commerce/ui";
import {
  BRAND_PALETTES,
  SHOP_BUSINESS_CATEGORIES,
  SHOP_VIBES,
  type ProductCountHint,
  type RankedTemplate,
  type StoreGoal,
  type SellingChannel,
} from "@guma-commerce/storefront-themes";

type Step = "dna" | "templates" | "personalize" | "preview" | "done";

const GOALS: { id: StoreGoal; label: string }[] = [
  { id: "launch_fast", label: "Launch fast" },
  { id: "brand_look", label: "Strong brand look" },
  { id: "conversion", label: "Maximize sales" },
  { id: "live_selling", label: "Live selling" },
];

const CHANNELS: { id: SellingChannel; label: string }[] = [
  { id: "social", label: "Social (FB / TikTok / IG)" },
  { id: "marketplace", label: "Marketplace" },
  { id: "in_person", label: "In-person / storefront" },
];

const PRODUCT_HINTS: { id: ProductCountHint; label: string }[] = [
  { id: "none", label: "Just starting" },
  { id: "1-10", label: "1–10 products" },
  { id: "11-50", label: "11–50 products" },
  { id: "50+", label: "50+ products" },
];

export function LaunchWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("dna");
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [urls, setUrls] = useState<{ storefront: string; preview: string } | null>(null);
  const [recommendations, setRecommendations] = useState<RankedTemplate[]>([]);
  const [libraryMatches, setLibraryMatches] = useState<
    Array<{
      proposedId: string;
      label: string;
      shopCategory: string;
      status: string;
      notes: string;
      previewImageUrl: string;
      installTemplateId: string | null;
    }>
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [category, setCategory] = useState<string>(SHOP_BUSINESS_CATEGORIES[0] ?? "General");
  const [vibe, setVibe] = useState("fresh");
  const [productCountHint, setProductCountHint] = useState<ProductCountHint>("1-10");
  const [goals, setGoals] = useState<StoreGoal[]>(["launch_fast"]);
  const [sellingChannels, setSellingChannels] = useState<SellingChannel[]>(["social"]);
  const [audience, setAudience] = useState("");

  const [tagline, setTagline] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoSubtitle, setPromoSubtitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#059669");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [paletteId, setPaletteId] = useState("guma-green");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/launch");
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not load launch state.");
        return;
      }

      setShopName(data.state.name);
      setSlug(data.state.slug);
      setUrls(data.urls);
      setRecommendations(data.recommendations ?? []);
      setLibraryMatches(data.libraryMatches ?? []);

      const dna = data.dna;
      if (dna) {
        setCategory(dna.category || category);
        setVibe(String(dna.vibe || "fresh"));
        if (dna.productCountHint) setProductCountHint(dna.productCountHint);
        if (dna.goals?.length) setGoals(dna.goals);
        if (dna.sellingChannels?.length) setSellingChannels(dna.sellingChannels);
        if (dna.audience) setAudience(dna.audience);
        if (dna.selectedTemplateId) setSelectedTemplateId(dna.selectedTemplateId);
      }

      const draft = data.draft;
      if (draft) {
        if (draft.tagline) setTagline(draft.tagline);
        if (draft.promoTitle) setPromoTitle(draft.promoTitle);
        if (draft.promoSubtitle) setPromoSubtitle(draft.promoSubtitle);
        if (draft.primaryColor) setPrimaryColor(draft.primaryColor);
        if (draft.accentColor) setAccentColor(draft.accentColor);
        if (draft.paletteId) setPaletteId(draft.paletteId);
        if (draft.templateId) setSelectedTemplateId(draft.templateId);
      }

      if (data.launchDone) {
        setStep("done");
      } else if (dna?.launchStep === "personalize" || dna?.launchStep === "preview") {
        setStep(dna.launchStep === "preview" ? "preview" : "personalize");
      } else if (dna?.launchStep === "templates") {
        setStep("templates");
      } else {
        setStep("dna");
      }
    } catch {
      setError("Something went wrong loading Launch.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function post(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Request failed.");
        return null;
      }
      return data;
    } catch {
      setError("Network error.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  function toggleGoal(id: StoreGoal) {
    setGoals((current) =>
      current.includes(id) ? current.filter((g) => g !== id) : [...current, id]
    );
  }

  function toggleChannel(id: SellingChannel) {
    setSellingChannels((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  }

  async function saveDna() {
    const data = await post({
      action: "save_dna",
      category,
      vibe,
      audience: audience || undefined,
      productCountHint,
      goals,
      sellingChannels,
    });
    if (!data) return;
    setRecommendations(data.recommendations ?? []);
    setLibraryMatches(data.libraryMatches ?? []);
    setStep("templates");
  }

  async function selectTemplate(id: string) {
    const data = await post({ action: "select_template", templateId: id });
    if (!data) return;
    setSelectedTemplateId(id);
    if (data.draft) {
      setTagline(data.draft.tagline ?? "");
      setPromoTitle(data.draft.promoTitle ?? "");
      setPromoSubtitle(data.draft.promoSubtitle ?? "");
      setPrimaryColor(data.draft.primaryColor ?? primaryColor);
      setAccentColor(data.draft.accentColor ?? accentColor);
      setPaletteId(data.draft.paletteId ?? paletteId);
    }
    setStep("personalize");
  }

  async function savePersonalize() {
    const data = await post({
      action: "personalize",
      tagline,
      promoTitle,
      promoSubtitle,
      primaryColor,
      accentColor,
      paletteId,
    });
    if (!data) return;
    setStep("preview");
  }

  async function publish() {
    const data = await post({ action: "publish" });
    if (!data) return;
    setStep("done");
  }

  function applyPalette(id: string) {
    const palette = BRAND_PALETTES.find((p) => p.id === id);
    if (!palette) return;
    setPaletteId(palette.id);
    setPrimaryColor(palette.primary);
    setAccentColor(palette.accent);
  }

  if (loading) {
    return (
      <PatternAdminShell title="GUMA Launch">
        <p className="text-sm text-gray-500">Preparing your launch…</p>
      </PatternAdminShell>
    );
  }

  return (
    <PatternAdminShell title="GUMA Launch">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Freemium · Zero AI cost
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Launch {shopName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Confirm your Store DNA, pick one of three recommended templates, personalize, then
            publish. You stay in control — AI does not generate layouts.
          </p>
        </div>

        <ol className="flex flex-wrap gap-2 text-xs font-medium">
          {(
            [
              ["dna", "1. Store DNA"],
              ["templates", "2. Templates"],
              ["personalize", "3. Personalize"],
              ["preview", "4. Preview"],
              ["done", "5. Published"],
            ] as const
          ).map(([id, label]) => (
            <li
              key={id}
              className={`rounded-full px-3 py-1 ${
                step === id
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {label}
            </li>
          ))}
        </ol>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {step === "dna" && (
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold text-gray-900">Store DNA</h2>
            <p className="text-sm text-gray-600">
              We inferred this from signup. Confirm or adjust — used only for template scoring.
            </p>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Category</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {SHOP_BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <p className="text-sm font-medium text-gray-700">Vibe</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SHOP_VIBES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVibe(v.id)}
                    className={`rounded-xl border p-3 text-left text-sm ${
                      vibe === v.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="font-medium">
                      {v.emoji} {v.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">{v.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Product count</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRODUCT_HINTS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setProductCountHint(h.id)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      productCountHint === h.id
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Goals</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      goals.includes(g.id)
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Selling channels</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChannel(c.id)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      sellingChannels.includes(c.id)
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Audience (optional)</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Busy moms in Metro Manila"
              />
            </label>

            <Button disabled={saving} onClick={() => void saveDna()}>
              {saving ? "Saving…" : "Continue to templates"}
            </Button>
          </Card>
        )}

        {step === "templates" && (
          <Card className="space-y-5 p-5">
            <div>
              <h2 className="font-semibold text-gray-900">Top templates for {category}</h2>
              <p className="mt-1 text-sm text-gray-600">
                Scored from the <strong>live storefront library</strong> (ported HTML themes + Guma
                skins), boosted by matches in the Free Bundle catalog (~100). Pick one to install —
                layout is fixed; you only personalize colors and copy next.
              </p>
            </div>

            <div className="grid gap-4">
              {recommendations.map((t, index) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={saving || !t.installable}
                  onClick={() => void selectTemplate(t.id)}
                  className={`overflow-hidden rounded-2xl border text-left transition hover:border-emerald-400 ${
                    selectedTemplateId === t.id
                      ? "border-emerald-500 ring-2 ring-emerald-500"
                      : "border-gray-200"
                  } ${!t.installable ? "opacity-70" : ""}`}
                >
                  <div className="relative aspect-[16/9] w-full bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.previewImageUrl}
                      alt={`${t.label} preview`}
                      className="h-full w-full object-cover"
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-90"
                      style={{ background: t.previewGradient }}
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        #{index + 1}
                      </span>
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                        {t.tier}
                      </span>
                      {!t.installable && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                          Needs {t.minPlan === "growth" ? "Pro" : "Advance"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{t.label}</p>
                      <span className="text-xs text-gray-400">Score {t.score}</span>
                    </div>
                    <p className="text-sm text-gray-600">{t.description}</p>
                    <p className="text-xs text-emerald-700">{t.reasons.join(" · ")}</p>
                    {t.librarySource && (
                      <p className="text-[11px] text-gray-500">
                        Free Bundle match: {t.librarySource.label} ({t.librarySource.status})
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {libraryMatches.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Also in the Free Bundle library for {category}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Not every catalog entry is ported yet. Choosing one installs the closest live
                  storefront package.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {libraryMatches.map((m) => (
                    <button
                      key={m.proposedId}
                      type="button"
                      disabled={saving || !m.installTemplateId}
                      onClick={() => m.installTemplateId && void selectTemplate(m.installTemplateId)}
                      className="overflow-hidden rounded-xl border border-gray-200 text-left hover:border-emerald-400 disabled:opacity-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.previewImageUrl}
                        alt={m.label}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                          {m.status.replace(/-/g, " ")}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{m.notes}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="text-sm text-gray-500 underline"
              onClick={() => setStep("dna")}
            >
              ← Back to Store DNA
            </button>
          </Card>
        )}

        {step === "personalize" && (
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold text-gray-900">Personalize</h2>
            <p className="text-sm text-gray-600">
              Colors and copy only — the template layout stays intact.
            </p>

            <div>
              <p className="text-sm font-medium text-gray-700">Palette</p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {BRAND_PALETTES.slice(0, 12).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPalette(p.id)}
                    className={`rounded-xl border p-2 text-left text-xs ${
                      paletteId === p.id ? "border-emerald-500 ring-1 ring-emerald-500" : "border-gray-200"
                    }`}
                  >
                    <span
                      className="mb-1 flex h-6 overflow-hidden rounded-md"
                      style={{
                        background: `linear-gradient(90deg, ${p.primary}, ${p.accent})`,
                      }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Primary
                <input
                  type="color"
                  className="mt-1 h-10 w-full"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Accent
                <input
                  type="color"
                  className="mt-1 h-10 w-full"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </label>
            </div>

            <label className="block text-sm">
              Tagline
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Promo title
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Promo subtitle
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={promoSubtitle}
                onChange={(e) => setPromoSubtitle(e.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => void savePersonalize()}>
                {saving ? "Saving…" : "Continue to preview"}
              </Button>
              <button
                type="button"
                className="text-sm text-gray-500 underline"
                onClick={() => setStep("templates")}
              >
                ← Change template
              </button>
            </div>
          </Card>
        )}

        {step === "preview" && (
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold text-gray-900">Preview & publish</h2>
            <p className="text-sm text-gray-600">
              Review your draft, then publish. Publishing does not go live to buyers until you
              activate the shop (add a product first).
            </p>
            <div
              className="rounded-2xl border border-gray-200 p-6"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}22, ${accentColor}33)`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {selectedTemplateId}
              </p>
              <h3 className="mt-1 text-xl font-bold" style={{ color: primaryColor }}>
                {shopName}
              </h3>
              <p className="mt-1 text-sm text-gray-700">{tagline}</p>
              <p className="mt-3 font-semibold text-gray-900">{promoTitle}</p>
              <p className="text-sm text-gray-600">{promoSubtitle}</p>
            </div>
            {urls && (
              <a
                href={urls.preview}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-medium text-emerald-700 underline"
              >
                Open draft preview ↗
              </a>
            )}
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => void publish()}>
                {saving ? "Publishing…" : "Publish storefront"}
              </Button>
              <button
                type="button"
                className="text-sm text-gray-500 underline"
                onClick={() => setStep("personalize")}
              >
                ← Edit personalization
              </button>
            </div>
          </Card>
        )}

        {step === "done" && (
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold text-emerald-800">Storefront published</h2>
            <p className="text-sm text-gray-600">
              Your template is installed and personalized. Next: add a product, then activate{" "}
              <code className="rounded bg-gray-100 px-1 text-xs">/{slug}</code> from the dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push("/products")}>Add products</Button>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium"
              >
                Go to dashboard
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PatternAdminShell>
  );
}
