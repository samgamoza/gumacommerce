"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@guma-commerce/ui";

interface SeoDraft {
  siteTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  robots?: { index?: boolean; follow?: boolean; extraRules?: string[] };
  openGraph?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    type?: string;
  };
  twitter?: {
    card?: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  rationale?: string;
}

const EMPTY: SeoDraft = {
  siteTitle: "",
  metaDescription: "",
  keywords: [],
  canonicalUrl: "",
  robots: { index: true, follow: true, extraRules: [] },
  openGraph: { title: "", description: "", imageUrl: "", type: "website" },
  twitter: {
    card: "summary_large_image",
    title: "",
    description: "",
    imageUrl: "",
  },
};

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm";
const areaClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm";

export function WorkspaceSeo() {
  const [draft, setDraft] = useState<SeoDraft>(EMPTY);
  const [published, setPublished] = useState<SeoDraft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [keywordsText, setKeywordsText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seo");
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not load SEO");
        return;
      }
      setDraft(data.draft ?? EMPTY);
      setPublished(data.published ?? EMPTY);
      setKeywordsText((data.draft?.keywords ?? []).join(", "));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch<K extends keyof SeoDraft>(key: K, value: SeoDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function payloadFromDraft() {
    return {
      ...draft,
      keywords: keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft()),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setDraft(data.draft);
      setNotice("Draft saved. Submit for approval to publish live.");
    } finally {
      setSaving(false);
    }
  }

  async function suggestAi() {
    setBusy("suggest");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/seo/suggest", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Suggest failed");
        return;
      }
      setDraft(data.suggestion);
      setKeywordsText((data.suggestion?.keywords ?? []).join(", "));
      setNotice(
        data.requiresReview
          ? "AI draft ready and queued as a change request. Review in Approvals, then publish."
          : "AI draft ready."
      );
    } finally {
      setBusy(null);
    }
  }

  async function submitForApproval() {
    setBusy("submit");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/seo/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo: payloadFromDraft() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Submit failed");
        return;
      }
      setNotice("Submitted for approval. Open Approvals to publish.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading SEO…</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Store SEO</h2>
        <p className="mt-1 text-sm text-gray-600">
          Draft metadata and social cards here. AI suggestions and your edits become change
          requests — nothing goes live until you approve &amp; publish in{" "}
          <Link href="/workspace/approvals" className="underline">
            Approvals
          </Link>
          .
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {notice && <p className="mt-3 text-sm text-emerald-700">{notice}</p>}
        {draft.rationale && (
          <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {draft.rationale}
          </p>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Store SEO</h3>
        <Field label="Site title">
          <input
            className={inputClass}
            value={draft.siteTitle ?? ""}
            onChange={(e) => patch("siteTitle", e.target.value)}
          />
        </Field>
        <Field label="Meta description">
          <textarea
            className={`${areaClass} min-h-[88px]`}
            value={draft.metaDescription ?? ""}
            onChange={(e) => patch("metaDescription", e.target.value)}
          />
        </Field>
        <Field label="Keywords (comma-separated)">
          <input
            className={inputClass}
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
          />
        </Field>
        <Field label="Canonical URL">
          <input
            className={inputClass}
            value={draft.canonicalUrl ?? ""}
            onChange={(e) => patch("canonicalUrl", e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.robots?.index !== false}
              onChange={(e) =>
                patch("robots", { ...draft.robots, index: e.target.checked })
              }
            />
            Allow indexing
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.robots?.follow !== false}
              onChange={(e) =>
                patch("robots", { ...draft.robots, follow: e.target.checked })
              }
            />
            Allow follow
          </label>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Social / Open Graph
        </h3>
        <Field label="OG title">
          <input
            className={inputClass}
            value={draft.openGraph?.title ?? ""}
            onChange={(e) =>
              patch("openGraph", { ...draft.openGraph, title: e.target.value })
            }
          />
        </Field>
        <Field label="OG description">
          <textarea
            className={`${areaClass} min-h-[72px]`}
            value={draft.openGraph?.description ?? ""}
            onChange={(e) =>
              patch("openGraph", { ...draft.openGraph, description: e.target.value })
            }
          />
        </Field>
        <Field label="OG image URL">
          <input
            className={inputClass}
            value={draft.openGraph?.imageUrl ?? ""}
            onChange={(e) =>
              patch("openGraph", { ...draft.openGraph, imageUrl: e.target.value })
            }
          />
        </Field>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Twitter Card
        </h3>
        <Field label="Card type">
          <select
            className={inputClass}
            value={draft.twitter?.card ?? "summary_large_image"}
            onChange={(e) =>
              patch("twitter", {
                ...draft.twitter,
                card: e.target.value as "summary" | "summary_large_image",
              })
            }
          >
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
          </select>
        </Field>
        <Field label="Twitter title">
          <input
            className={inputClass}
            value={draft.twitter?.title ?? ""}
            onChange={(e) =>
              patch("twitter", { ...draft.twitter, title: e.target.value })
            }
          />
        </Field>
        <Field label="Twitter description">
          <textarea
            className={`${areaClass} min-h-[72px]`}
            value={draft.twitter?.description ?? ""}
            onChange={(e) =>
              patch("twitter", { ...draft.twitter, description: e.target.value })
            }
          />
        </Field>
        <Field label="Twitter image URL">
          <input
            className={inputClass}
            value={draft.twitter?.imageUrl ?? ""}
            onChange={(e) =>
              patch("twitter", { ...draft.twitter, imageUrl: e.target.value })
            }
          />
        </Field>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Published snapshot
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Live title:{" "}
          <span className="font-medium text-gray-900">
            {published.siteTitle || "(not published yet)"}
          </span>
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!!busy || saving}
          onClick={() => void saveDraft()}
        >
          {saving ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!!busy}
          onClick={() => void suggestAi()}
        >
          {busy === "suggest" ? "Suggesting…" : "Suggest with AI"}
        </Button>
        <Button type="button" disabled={!!busy} onClick={() => void submitForApproval()}>
          {busy === "submit" ? "Submitting…" : "Submit for approval"}
        </Button>
        <Link
          href="/workspace/approvals"
          className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Open Approvals
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
