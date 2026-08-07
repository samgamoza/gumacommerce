"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { Button, Card } from "@guma-commerce/ui";
import {
  BRAND_PALETTES,
  emojiForGuideCategory,
  guideEntryOrFallback,
  hintBrandGuardCopy,
  type ProductCountHint,
  type RankedTemplate,
  type StoreGoal,
  type SellingChannel,
} from "@guma-commerce/storefront-themes";

/** Dark-console chips — selected stays vivid; idle stays readable. */
const chipIdle =
  "rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:border-emerald-500/50";
const chipActive = "rounded-full border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white";
const fieldHint = "text-sm text-slate-300";
const sectionLabel = "text-sm font-semibold text-foreground";

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
  const [curatedTemplates, setCuratedTemplates] = useState<
    Array<{
      proposedId: string;
      label: string;
      shopCategory: string;
      status: string;
      notes: string;
      previewImageUrl: string;
      installTemplateId: string;
      installable: boolean;
      usesLiveLabel: string;
    }>
  >([]);
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
  const [selectedCatalogLabel, setSelectedCatalogLabel] = useState<string | null>(null);

  const [category, setCategory] = useState("General");
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
      setCuratedTemplates(data.curatedTemplates ?? []);
      setLibraryMatches(data.libraryMatches ?? []);

      const dna = data.dna;
      setCategory(dna?.category || data.state?.category || "General");
      if (dna) {
        setVibe(String(dna.vibe || "fresh"));
        if (dna.productCountHint) setProductCountHint(dna.productCountHint);
        if (dna.goals?.length) setGoals(dna.goals);
        if (dna.sellingChannels?.length) setSellingChannels(dna.sellingChannels);
        if (dna.audience) setAudience(dna.audience);
      }

      const draft = data.draft;
      if (draft) {
        if (draft.tagline) setTagline(draft.tagline);
        if (draft.promoTitle) setPromoTitle(draft.promoTitle);
        if (draft.promoSubtitle) setPromoSubtitle(draft.promoSubtitle);
        if (draft.primaryColor) setPrimaryColor(draft.primaryColor);
        if (draft.accentColor) setAccentColor(draft.accentColor);
        if (draft.paletteId) setPaletteId(draft.paletteId);
        if (draft.catalogLabel) setSelectedCatalogLabel(draft.catalogLabel);
        // Prefer curated catalog identity for selection highlight
        if (draft.catalogId) setSelectedTemplateId(draft.catalogId);
        else if (dna?.selectedTemplateId) setSelectedTemplateId(dna.selectedTemplateId);
        else if (draft.templateId) setSelectedTemplateId(draft.templateId);
      } else if (dna?.selectedTemplateId) {
        setSelectedTemplateId(dna.selectedTemplateId);
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
    setCuratedTemplates(data.curatedTemplates ?? []);
    setLibraryMatches(data.libraryMatches ?? []);
    setStep("templates");
  }

  async function selectTemplate(id: string) {
    const data = await post({ action: "select_template", templateId: id });
    if (!data) return;
    setSelectedTemplateId(data.install?.selectionId ?? id);
    setSelectedCatalogLabel(data.install?.catalogLabel ?? data.draft?.catalogLabel ?? null);
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
        <p className="text-sm text-muted-foreground">Preparing your launch…</p>
      </PatternAdminShell>
    );
  }

  return (
    <PatternAdminShell title="GUMA Launch">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Freemium · Zero AI cost
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Launch {shopName}</h1>
          <p className="mt-1 text-sm text-slate-300">
            Confirm a few details, pick a look for your category, personalize, then publish.
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
                  : "border border-border bg-secondary text-slate-300"
              }`}
            >
              {label}
            </li>
          ))}
        </ol>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {step === "dna" && (
          <Card className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Store DNA</h2>
              <p className={`mt-1 ${fieldHint}`}>
                Finish a few details so we can rank the right looks. Your business type is already set
                from signup.
              </p>
            </div>

            {/* Read-only guide — category was chosen at signup / shop setup */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                From your signup
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">{shopName || "Your shop"}</p>
              <p className="mt-2 flex items-start gap-2 text-sm text-foreground">
                <span className="text-lg leading-none" aria-hidden>
                  {emojiForGuideCategory(category)}
                </span>
                <span>
                  <span className="font-semibold">{category}</span>
                  <span className="mt-0.5 block text-sm text-slate-300">
                    {guideEntryOrFallback(category).plain}
                  </span>
                </span>
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Wrong category?{" "}
                <Link
                  href="/settings/shop"
                  className="font-medium text-emerald-300 underline-offset-2 hover:underline"
                >
                  Update in Shop settings
                </Link>
              </p>
            </div>

            <div>
              <p className={sectionLabel}>Product count</p>
              <p className={`mt-0.5 text-xs text-slate-400`}>About how many items will you list?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRODUCT_HINTS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setProductCountHint(h.id)}
                    className={productCountHint === h.id ? chipActive : chipIdle}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={sectionLabel}>Goals</p>
              <p className="mt-0.5 text-xs text-slate-400">What matters most for this launch?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className={goals.includes(g.id) ? chipActive : chipIdle}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={sectionLabel}>Selling channels</p>
              <p className="mt-0.5 text-xs text-slate-400">Where do customers find you today?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChannel(c.id)}
                    className={sellingChannels.includes(c.id) ? chipActive : chipIdle}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className={sectionLabel}>Audience (optional)</span>
              <p className="mt-0.5 text-xs text-slate-400">Who do you mainly sell to?</p>
              <input
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
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
              <h2 className="font-semibold text-foreground">
                Pick a look for {category}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Based on <span className="font-medium text-foreground">{category}</span> from your
                signup — only looks that fit that shop type.
              </p>
            </div>

            {recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">Best fits</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Top matches for {category}. Tap one to continue.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {recommendations.map((t, index) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={saving || !t.installable}
                      onClick={() => void selectTemplate(t.id)}
                      className={`overflow-hidden rounded-2xl border text-left transition hover:border-emerald-400 ${
                        selectedTemplateId === t.id
                          ? "border-emerald-500 ring-2 ring-emerald-500"
                          : "border-border"
                      } ${!t.installable ? "opacity-70" : ""}`}
                    >
                      <div className="relative aspect-[16/10] w-full bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.previewImageUrl}
                          alt={`${t.label} preview`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                          <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            #{index + 1}
                          </span>
                          {!t.installable && (
                            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Upgrade
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5 p-3">
                        <p className="text-sm font-semibold text-foreground">{t.label}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {curatedTemplates.length > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">
                  More in {category} ({curatedTemplates.length})
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Extra looks in your category if you want another option.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {curatedTemplates.map((m) => (
                    <button
                      key={m.proposedId}
                      type="button"
                      disabled={saving || !m.installable}
                      onClick={() => void selectTemplate(m.proposedId)}
                      className={`overflow-hidden rounded-xl border text-left transition hover:border-emerald-400 disabled:opacity-50 ${
                        selectedTemplateId === m.proposedId
                          ? "border-emerald-500 ring-2 ring-emerald-500"
                          : "border-border"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.previewImageUrl}
                        alt={m.label}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground">{m.label}</p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {m.status.replace(/-/g, " ")} · uses {m.usesLiveLabel}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.notes}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {curatedTemplates.length === 0 && libraryMatches.length > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Free Bundle library for {category}
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {libraryMatches.map((m) => (
                    <button
                      key={m.proposedId}
                      type="button"
                      disabled={saving || !m.installTemplateId}
                      onClick={() => m.installTemplateId && void selectTemplate(m.proposedId)}
                      className="overflow-hidden rounded-xl border border-border text-left hover:border-emerald-400 disabled:opacity-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.previewImageUrl}
                        alt={m.label}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground">{m.label}</p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {m.status.replace(/-/g, " ")}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.notes}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="text-sm text-muted-foreground underline"
              onClick={() => setStep("dna")}
            >
              ← Back to Store DNA
            </button>
          </Card>
        )}

        {step === "personalize" && (
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold text-foreground">Personalize</h2>
            <p className="text-sm text-muted-foreground">
              Colors and copy only — the template layout stays intact.
              {selectedCatalogLabel ? (
                <>
                  {" "}
                  Using curated look <span className="font-medium text-foreground">{selectedCatalogLabel}</span>.
                </>
              ) : null}
            </p>

            <div>
              <p className="text-sm font-medium text-foreground">Palette</p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {BRAND_PALETTES.slice(0, 12).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPalette(p.id)}
                    className={`rounded-xl border p-2 text-left text-xs ${
                      paletteId === p.id ? "border-emerald-500 ring-1 ring-emerald-500" : "border-border"
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
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
              {hintBrandGuardCopy(tagline).map((hint) => (
                <p key={hint} className="mt-1 text-xs text-amber-700">
                  {hint}
                </p>
              ))}
            </label>
            <label className="block text-sm">
              Promo title
              <input
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
              />
              {hintBrandGuardCopy(promoTitle).map((hint) => (
                <p key={hint} className="mt-1 text-xs text-amber-700">
                  {hint}
                </p>
              ))}
            </label>
            <label className="block text-sm">
              Promo subtitle
              <input
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                value={promoSubtitle}
                onChange={(e) => setPromoSubtitle(e.target.value)}
              />
              {hintBrandGuardCopy(promoSubtitle).map((hint) => (
                <p key={hint} className="mt-1 text-xs text-amber-700">
                  {hint}
                </p>
              ))}
            </label>

            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => void savePersonalize()}>
                {saving ? "Saving…" : "Continue to preview"}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground underline"
                onClick={() => setStep("templates")}
              >
                ← Change template
              </button>
            </div>
          </Card>
        )}

        {step === "preview" && (
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold text-foreground">Preview & publish</h2>
            <p className="text-sm text-muted-foreground">
              Review your draft, then publish. Publishing does not go live to buyers until you
              activate the shop (add a product first).
            </p>
            <div
              className="rounded-2xl border border-border p-6"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}22, ${accentColor}33)`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedTemplateId}
              </p>
              <h3 className="mt-1 text-xl font-bold" style={{ color: primaryColor }}>
                {shopName}
              </h3>
              <p className="mt-1 text-sm text-foreground">{tagline}</p>
              <p className="mt-3 font-semibold text-foreground">{promoTitle}</p>
              <p className="text-sm text-muted-foreground">{promoSubtitle}</p>
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
                className="text-sm text-muted-foreground underline"
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
            <p className="text-sm text-muted-foreground">
              Your template is installed and personalized. Next: add a product, then activate{" "}
              <code className="rounded bg-muted px-1 text-xs">/{slug}</code> from the dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push("/products")}>Add products</Button>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-medium"
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
