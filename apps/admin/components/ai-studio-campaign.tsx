"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clapperboard,
  Lock,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { Button, Card } from "@guma-commerce/ui";

const CAMPAIGN_MODULES = [
  {
    id: "guma-brand",
    title: "Guma Brand Kit",
    description: "Luxury visual identity — palette, typography, tone of voice for premium social.",
    icon: Sparkles,
    status: "preview" as const,
  },
  {
    id: "video-studio",
    title: "Video Marketing Studio",
    description: "Short-form scripts, shot lists, hooks, and carousel frames for Reels & TikTok.",
    icon: Clapperboard,
    status: "live" as const,
  },
  {
    id: "campaign-manager",
    title: "AI Campaign Manager",
    description: "7-day omnichannel plans with promos, bundles, and KPI targets.",
    icon: Calendar,
    status: "live" as const,
  },
  {
    id: "auto-publish",
    title: "Auto-publish to social",
    description: "Schedule and publish approved posts to Meta & TikTok from Guma Commerce.",
    icon: Video,
    status: "soon" as const,
  },
];

const GENERATORS = [
  {
    key: "tiktok_package",
    label: "Guma TikTok Pack",
    hint: "Hooks, script, shot list, caption — cinematic short-form",
  },
  {
    key: "social_post",
    label: "Premium Social Post",
    hint: "Instagram / Facebook conversion copy with visual brief",
  },
  {
    key: "campaign_strategy",
    label: "Full Campaign Plan",
    hint: "7-day video + social calendar with promos",
  },
  {
    key: "product_listing",
    label: "Product Story Listing",
    hint: "Catalog copy aligned with your brand voice",
  },
] as const;

type ShopContext = {
  brandName: string;
  category: string;
  orderLink: string;
  tagline: string;
};

export function AiStudioCampaign() {
  const [shop, setShop] = useState<ShopContext | null>(null);
  const [selected, setSelected] = useState<(typeof GENERATORS)[number]["key"]>("tiktok_package");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const loadShop = useCallback(async () => {
    const res = await fetch("/api/shop");
    const data = await res.json();
    if (data.ok && data.urls) {
      setShop({
        brandName: data.shop.tenant.name,
        category: data.shop.tenant.category ?? "General",
        orderLink: data.urls.orderLink,
        tagline: data.theme?.tagline ?? "",
      });
    }
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  async function handleGenerate() {
    if (!shop) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selected,
          userPrompt:
            prompt ||
            `Guma-style premium campaign for ${shop.brandName}. ${shop.tagline}. Focus on video-first luxury branding.`,
          seller: {
            brandName: shop.brandName,
            category: shop.category,
            location: "Philippines",
            tone: "gen_z_taglish",
            audience: "Filipino mobile shoppers who love premium visuals",
            orderLink: shop.orderLink,
          },
        }),
      });
      const data = await res.json();
      setResult((data.output ?? data) as Record<string, unknown>);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatternAdminShell title="AI Studio">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-violet-950 to-black p-8 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-violet-200">
            Guma Commerce · Future release preview
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Guma Campaign Studio
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-100/85 md:text-base">
            Full AI-powered video marketing and campaign management — premium branding, short-form
            scripts, and omnichannel calendars. Agentic scheduling lives in{" "}
            <Link href="/agents" className="font-semibold text-cyan-300 underline-offset-2 hover:underline">
              Agents
            </Link>
            .
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CAMPAIGN_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.id}
              className={`relative overflow-hidden p-5 ${
                module.status === "soon" ? "opacity-90" : ""
              }`}
            >
              {module.status === "soon" && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <Lock className="h-3 w-3" /> Coming soon
                </span>
              )}
              {module.status === "preview" && (
                <span className="absolute right-3 top-3 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                  Preview
                </span>
              )}
              <Icon className="h-5 w-5 text-violet-600" />
              <h3 className="mt-3 font-semibold">{module.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{module.description}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <Wand2 className="h-4 w-4 text-violet-600" />
            Generate now
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Uses your live shop data{shop ? ` — ${shop.brandName}` : ""}.
          </p>
          <div className="mt-4 space-y-2">
            {GENERATORS.map((gen) => (
              <button
                key={gen.key}
                type="button"
                onClick={() => setSelected(gen.key)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selected === gen.key
                    ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm font-semibold">{gen.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{gen.hint}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <label className="text-sm font-medium text-gray-700">Campaign brief</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="e.g. Guma-style summer video campaign — golden hour product shots, whispered Taglish VO, payday promo ₱499 bundle"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleGenerate} disabled={loading || !shop}>
              {loading ? "Generating…" : "Generate campaign asset"}
            </Button>
            <Link href="/agents">
              <Button variant="secondary">Send to agent queue →</Button>
            </Link>
          </div>
        </Card>
      </div>

      {result && (
        <Card className="mt-6 overflow-hidden p-0">
          <div className="border-b border-gray-100 bg-zinc-950 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
              Generated output
            </p>
          </div>
          <pre className="max-h-[520px] overflow-auto bg-zinc-950 p-5 text-xs leading-relaxed text-emerald-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </PatternAdminShell>
  );
}
