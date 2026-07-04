"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, formatPrice } from "@guma-commerce/ui";

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  basePrice: string;
  status: string;
  stockQty: number;
  aiGenerated: boolean;
  imageUrl: string | null;
}

interface ProductDraft {
  title: string;
  slug: string;
  descriptionHtml: string;
  shortDescription: string;
  basePrice: string;
  compareAtPrice: string;
  stockQty: string;
  status: "draft" | "active";
  tags: string[];
  photoShotList: string[];
  imageUrl: string;
}

interface ShopContext {
  name: string;
  category: string | null;
}

const EXAMPLE_PROMPTS = [
  "Mango bravo cake, party size, around ₱399",
  "Ube cheese pandesal dozen, fresh daily, ₱180",
  "Custom tarpaulin printing 2x3 ft, 3-day turnaround",
  "Iced Spanish latte 16oz, perfect for summer",
];

const EMPTY_DRAFT: ProductDraft = {
  title: "",
  slug: "",
  descriptionHtml: "",
  shortDescription: "",
  basePrice: "",
  compareAtPrice: "",
  stockQty: "10",
  status: "active",
  tags: [],
  photoShotList: [],
  imageUrl: "",
};

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

function productImageSrc(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `${STOREFRONT_URL}${url}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function ProductsManager() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [shop, setShop] = useState<ShopContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [priceHint, setPriceHint] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [productsRes, shopRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/shop"),
    ]);
    const productsData = await productsRes.json();
    const shopData = await shopRes.json();
    if (productsData.ok) setProducts(productsData.products);
    if (shopData.ok) {
      setShop({
        name: shopData.shop.tenant.name,
        category: shopData.shop.tenant.category,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreateForm() {
    setShowForm(true);
    setError(null);
    setDraft(null);
    setAiModel(null);
    setManualMode(false);
    setAiPrompt("");
    setPriceHint("");
  }

  function closeCreateForm() {
    setShowForm(false);
    setDraft(null);
    setAiModel(null);
    setError(null);
    setAiPrompt("");
    setPriceHint("");
    setManualMode(false);
    setOriginalImageUrl(null);
    setEnhancing(false);
  }

  async function handleGenerate() {
    if (aiPrompt.trim().length < 3) {
      setError("Describe your product in at least a few words.");
      return;
    }

    setError(null);
    setGenerating(true);

    const hint = priceHint ? Number(priceHint) : undefined;
    const res = await fetch("/api/products/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: aiPrompt.trim(),
        priceHint: hint && Number.isFinite(hint) && hint > 0 ? hint : undefined,
      }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!data.ok) {
      setError(data.error ?? "Could not generate listing.");
      return;
    }

    const listing = data.listing;
    setDraft({
      title: listing.title,
      slug: listing.slug,
      descriptionHtml: listing.descriptionHtml,
      shortDescription: listing.shortDescription,
      basePrice: String(listing.basePrice),
      compareAtPrice: listing.compareAtPrice ? String(listing.compareAtPrice) : "",
      stockQty: "10",
      status: "active",
      tags: listing.tags ?? [],
      photoShotList: listing.photoShotList ?? [],
      imageUrl: "",
    });
    setAiModel(data.model ?? "ai");
    setManualMode(false);
  }

  function startManualEntry() {
    setManualMode(true);
    setDraft({ ...EMPTY_DRAFT });
    setAiModel(null);
    setError(null);
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/products/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploadingImage(false);
    event.target.value = "";

    if (!data.ok) {
      setError(data.error ?? "Could not upload image.");
      return;
    }

    setDraft((current) =>
      current ? { ...current, imageUrl: data.url } : { ...EMPTY_DRAFT, imageUrl: data.url }
    );
    setOriginalImageUrl(data.url);
  }

  async function handleEnhancePhoto() {
    if (!draft?.imageUrl) return;

    setError(null);
    setEnhancing(true);

    const sourceUrl = originalImageUrl ?? draft.imageUrl;
    const res = await fetch("/api/products/enhance-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: sourceUrl,
      }),
    });

    const data = await res.json();
    setEnhancing(false);

    if (!data.ok) {
      setError(data.error ?? "Could not remove background.");
      return;
    }

    if (!originalImageUrl) {
      setOriginalImageUrl(sourceUrl);
    }
    setDraft((current) => (current ? { ...current, imageUrl: data.url } : current));
  }

  function useOriginalPhoto() {
    if (!originalImageUrl) return;
    setDraft((current) => (current ? { ...current, imageUrl: originalImageUrl } : current));
  }

  function removeImage() {
    setDraft((current) => (current ? { ...current, imageUrl: "" } : current));
    setOriginalImageUrl(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;

    setError(null);
    setSaving(true);

    const price = Number(draft.basePrice);
    if (!draft.title.trim()) {
      setError("Product name is required.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price.");
      setSaving(false);
      return;
    }

    const compareAt = draft.compareAtPrice ? Number(draft.compareAtPrice) : null;

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title.trim(),
        slug: draft.slug || draft.title,
        descriptionHtml: draft.descriptionHtml || `<p>${draft.shortDescription || draft.title}</p>`,
        basePrice: price,
        compareAtPrice: compareAt && compareAt > price ? compareAt : undefined,
        status: draft.status,
        stockQty: Number(draft.stockQty) || 0,
        aiGenerated: Boolean(aiModel),
        imageUrl: draft.imageUrl || undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!data.ok) {
      setError(data.error ?? "Could not save product.");
      return;
    }

    closeCreateForm();
    await load();
  }

  const showEmptyComposer = products.length === 0 && !showForm;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {shop
              ? `AI listings for ${shop.name}${shop.category ? ` · ${shop.category}` : ""}`
              : "Describe products in plain language — AI writes the listing."}
          </p>
        </div>
        {!showEmptyComposer && (
          <Button onClick={showForm ? closeCreateForm : openCreateForm}>
            {showForm ? "Cancel" : "+ Add product with AI"}
          </Button>
        )}
      </div>

      {(showForm || showEmptyComposer) && (
        <Card className="mb-6 overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-semibold">AI product creator</h3>
                <Badge className="bg-emerald-100 text-emerald-800">New</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Tell us what you sell — name, size, price, occasion. AI generates title,
                description, and suggested pricing for your shop.
              </p>
            </div>
            {showEmptyComposer && (
              <button
                type="button"
                onClick={startManualEntry}
                className="shrink-0 text-sm text-gray-500 underline"
              >
                Manual entry
              </button>
            )}
          </div>

          {!draft && !manualMode && (
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Describe your product
                </span>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. Mango bravo cake, good for birthdays, serves 8-10 people, ₱399"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setAiPrompt(example)}
                    className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs text-emerald-800 transition hover:bg-emerald-50"
                  >
                    {example.length > 42 ? `${example.slice(0, 42)}…` : example}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className="block w-full sm:w-40">
                  <span className="mb-1 block text-xs font-medium text-gray-500">
                    Price hint (optional)
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={priceHint}
                    onChange={(e) => setPriceHint(e.target.value)}
                    placeholder="399"
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                  />
                </label>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generating listing…" : "Generate with AI"}
                </Button>
                {!showEmptyComposer && (
                  <button
                    type="button"
                    onClick={startManualEntry}
                    className="text-sm text-gray-500 underline"
                  >
                    Skip AI, enter manually
                  </button>
                )}
              </div>
            </div>
          )}

          {(draft || manualMode) && (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium">Review & edit listing</h4>
                {aiModel && <Badge>AI · {aiModel === "mock" ? "demo mode" : "generated"}</Badge>}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              {manualMode && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Product photo
                  </span>
                  {draft?.imageUrl ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImageSrc(draft.imageUrl)}
                          alt={draft.title || "Product preview"}
                          className="h-36 w-36 rounded-xl border border-gray-100 object-cover"
                        />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {originalImageUrl && draft.imageUrl !== originalImageUrl
                              ? "Background removed — clean photo selected for your shop."
                              : "Photo ready — remove the background for a cleaner storefront look."}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <label className="inline-flex cursor-pointer items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                              Replace photo
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handleImageSelect}
                                disabled={uploadingImage}
                              />
                            </label>
                            {originalImageUrl && draft.imageUrl !== originalImageUrl && (
                              <button
                                type="button"
                                onClick={useOriginalPhoto}
                                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Use original
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={removeImage}
                              className="rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Remove background (free)
                            </p>
                            <p className="text-xs text-gray-600">
                              Cuts out your product and places it on a clean white background.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={handleEnhancePhoto}
                            disabled={enhancing}
                          >
                            {enhancing
                              ? "Removing… (first run may take a minute)"
                              : "Remove background"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 px-6 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={uploadingImage}
                      />
                      <span className="text-3xl">📷</span>
                      <span className="mt-2 text-sm font-medium text-gray-800">
                        {uploadingImage ? "Uploading…" : "Click to upload a product photo"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        JPG, PNG, WebP, or GIF · up to 5 MB
                      </span>
                    </label>
                  )}
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Product name</span>
                <input
                  required
                  value={draft?.title ?? ""}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, title: e.target.value } : d))
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                />
              </label>

              {draft?.shortDescription && (
                <p className="text-sm text-gray-600">{draft.shortDescription}</p>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Description</span>
                <textarea
                  value={draft ? stripHtml(draft.descriptionHtml) : ""}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            descriptionHtml: `<p>${e.target.value.replace(/\n/g, "</p><p>")}</p>`,
                            shortDescription: e.target.value.split("\n")[0] ?? "",
                          }
                        : d
                    )
                  }
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Price (PHP)</span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={draft?.basePrice ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, basePrice: e.target.value } : d))
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">
                    Compare-at (optional)
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={draft?.compareAtPrice ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, compareAtPrice: e.target.value } : d))
                    }
                    placeholder="499"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={draft?.stockQty ?? "10"}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, stockQty: e.target.value } : d))
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                  />
                </label>
              </div>

              <label className="block sm:max-w-xs">
                <span className="mb-1 block text-sm font-medium text-gray-700">Status</span>
                <select
                  value={draft?.status ?? "active"}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, status: e.target.value as "draft" | "active" } : d
                    )
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="active">Active (visible on storefront)</option>
                  <option value="draft">Draft (hidden)</option>
                </select>
              </label>

              {draft && draft.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {draft.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {draft && draft.photoShotList.length > 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Photo tips from AI
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    {draft.photoShotList.map((tip) => (
                      <li key={tip}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save product"}
                </Button>
                {aiModel && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? "Regenerating…" : "Regenerate with AI"}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDraft(null);
                    setManualMode(false);
                    setAiModel(null);
                  }}
                  className="px-3 text-sm text-gray-500 underline"
                >
                  Start over
                </button>
              </div>
            </form>
          )}

          {error && !draft && !manualMode && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </Card>
      )}

      {loading ? (
        <p className="text-gray-500">Loading products…</p>
      ) : products.length === 0 && !showForm ? (
        <Card className="border-dashed">
          <p className="font-medium">No products yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Use the AI creator above, then activate your shop from the dashboard.
          </p>
        </Card>
      ) : products.length > 0 ? (
        <div className="grid gap-3">
          {products.map((product) => (
            <Card key={product.id} className="flex items-center justify-between gap-4">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productImageSrc(product.imageUrl)}
                  alt={product.title}
                  className="h-16 w-16 shrink-0 rounded-xl border border-gray-100 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
                  🛍️
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{product.title}</h3>
                  {product.aiGenerated && (
                    <Badge className="bg-violet-100 text-violet-800">AI</Badge>
                  )}
                  <Badge
                    className={
                      product.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {product.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {formatPrice(Number(product.basePrice))} · Stock: {product.stockQty} · /
                  {product.slug}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
