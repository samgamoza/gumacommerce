"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, formatPrice } from "@guma-commerce/ui";

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  descriptionHtml: string | null;
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
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";

function productImageSrc(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // Local disk uploads live under apps/web/public — preview via admin proxy
  // so the Products UI works even if the storefront isn't running.
  if (url.startsWith("/uploads/products/")) {
    return `/api/products/media?path=${encodeURIComponent(url)}`;
  }
  return `${STOREFRONT_URL}${url}`;
}

/** Plain text for the description editor — preserve spaces/newlines (no trim). */
function htmlToPlainDescription(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function plainDescriptionToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (!escaped) return "";
  return `<p>${escaped.replace(/\n/g, "</p><p>")}</p>`;
}

export function ProductsManager() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [shop, setShop] = useState<ShopContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [changeRequestId, setChangeRequestId] = useState<string | null>(null);
  const [requiresReview, setRequiresReview] = useState(false);
  const [pricingNote, setPricingNote] = useState<string | null>(null);
  const [suggestingPrice, setSuggestingPrice] = useState(false);
  const [descriptionNote, setDescriptionNote] = useState<string | null>(null);

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
    setDraft({ ...EMPTY_DRAFT });
    setEditingId(null);
    setNotice(null);
    setChangeRequestId(null);
    setRequiresReview(false);
    setPricingNote(null);
    setDescriptionNote(null);
    setOriginalImageUrl(null);
  }

  function closeCreateForm() {
    setShowForm(false);
    setDraft(null);
    setError(null);
    setOriginalImageUrl(null);
    setEnhancing(false);
    setEnhancingDescription(false);
    setEditingId(null);
    setChangeRequestId(null);
    setRequiresReview(false);
    setPricingNote(null);
    setDescriptionNote(null);
  }

  function startEdit(product: ProductRow) {
    setShowForm(true);
    setEditingId(product.id);
    setError(null);
    setNotice(null);
    setChangeRequestId(null);
    setRequiresReview(false);
    setPricingNote(null);
    setDescriptionNote(null);
    setOriginalImageUrl(product.imageUrl);
    setDraft({
      title: product.title,
      slug: product.slug,
      descriptionHtml: product.descriptionHtml ?? "",
      shortDescription: "",
      basePrice: String(Number(product.basePrice)),
      compareAtPrice: product.compareAtPrice ? String(Number(product.compareAtPrice)) : "",
      stockQty: String(product.stockQty),
      // Archived products come back as drafts so they stay hidden until re-activated.
      status: product.status === "active" ? "active" : "draft",
      tags: [],
      photoShotList: [],
      imageUrl: product.imageUrl ?? "",
    });
  }

  async function handleDelete(product: ProductRow) {
    const confirmed = window.confirm(
      `Delete "${product.title}"? If it has past orders it will be archived instead.`
    );
    if (!confirmed) return;

    setDeletingId(product.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not delete product.");
        return;
      }
      setNotice(
        data.result === "archived"
          ? `"${product.title}" has past orders, so it was archived (hidden from your shop).`
          : `"${product.title}" deleted.`
      );
      await load();
    } finally {
      setDeletingId(null);
    }
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

  async function handleEnhanceDescription() {
    if (!draft?.title.trim()) {
      setError("Enter a product name first, then enhance the description.");
      return;
    }

    setError(null);
    setDescriptionNote(null);
    setEnhancingDescription(true);
    try {
      const res = await fetch("/api/products/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: htmlToPlainDescription(draft.descriptionHtml),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not enhance description.");
        return;
      }
      setDraft((current) =>
        current
          ? {
              ...current,
              descriptionHtml: data.descriptionHtml,
              shortDescription: data.shortDescription ?? current.shortDescription,
            }
          : current
      );
      setChangeRequestId(data.changeRequestId ?? null);
      setRequiresReview(Boolean(data.requiresReview));
      setDescriptionNote("AI polished your description — review and edit before saving.");
    } finally {
      setEnhancingDescription(false);
    }
  }

  async function handleSuggestPrice() {
    if (!draft?.title.trim()) {
      setError("Enter a product name first, then suggest a nearby price.");
      return;
    }

    setError(null);
    setSuggestingPrice(true);
    try {
      const current = Number(draft.basePrice);
      const res = await fetch("/api/products/suggest-market-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          currentPrice:
            Number.isFinite(current) && current > 0 ? current : undefined,
          productId: editingId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not suggest a price.");
        return;
      }
      const suggestion = data.suggestion;
      setDraft((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              basePrice: String(suggestion.basePrice),
              compareAtPrice: suggestion.compareAtPrice
                ? String(suggestion.compareAtPrice)
                : currentDraft.compareAtPrice,
            }
          : currentDraft
      );
      setChangeRequestId(data.changeRequestId ?? null);
      setRequiresReview(Boolean(data.requiresReview));
      setPricingNote(suggestion.rationale ?? "Nearby market price suggested — review and save.");
    } finally {
      setSuggestingPrice(false);
    }
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

    const res = editingId
      ? await fetch(`/api/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title.trim(),
            descriptionHtml:
              draft.descriptionHtml || `<p>${draft.shortDescription || draft.title}</p>`,
            basePrice: price,
            compareAtPrice: compareAt && compareAt > price ? compareAt : null,
            status: draft.status,
            stockQty: Number(draft.stockQty) || 0,
            imageUrl: draft.imageUrl || null,
            changeRequestId: changeRequestId ?? undefined,
          }),
        })
      : await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title.trim(),
            slug: draft.slug || draft.title,
            descriptionHtml:
              draft.descriptionHtml || `<p>${draft.shortDescription || draft.title}</p>`,
            basePrice: price,
            compareAtPrice: compareAt && compareAt > price ? compareAt : undefined,
            status: draft.status,
            stockQty: Number(draft.stockQty) || 0,
            aiGenerated: false,
            imageUrl: draft.imageUrl || undefined,
            changeRequestId: changeRequestId ?? undefined,
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {shop
              ? `Catalog for ${shop.name}${shop.category ? ` · ${shop.category}` : ""}`
              : "Add products yourself. AI can polish copy or suggest nearby prices."}
          </p>
        </div>
        {showForm ? (
          <Button type="button" variant="secondary" onClick={closeCreateForm}>
            Cancel
          </Button>
        ) : (
          <Button type="button" onClick={openCreateForm}>
            + Add product
          </Button>
        )}
      </div>

      {showForm && draft && (
        <Card className="mb-6 border-white/10 bg-white/[0.03]">
          <div className="mb-5">
            <h3 className="font-semibold text-slate-100">
              {editingId ? "Edit product" : "New product"}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Fill in the basics yourself. Use AI only to enhance the description or suggest a
              nearby market price.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {changeRequestId && requiresReview && (
              <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100/90">
                An AI suggestion is tracked as a change request. Saving applies it to your catalog.
              </p>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="rounded-xl border border-border bg-card p-4">
              <span className="mb-2 block text-sm font-medium text-foreground">Product photo</span>
              {draft.imageUrl ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImageSrc(draft.imageUrl)}
                      alt={draft.title || "Product preview"}
                      className="h-36 w-36 rounded-xl border border-border object-cover bg-muted"
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {originalImageUrl && draft.imageUrl !== originalImageUrl
                          ? "Background removed — clean photo selected for your shop."
                          : "Photo ready — remove the background for a cleaner storefront look."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
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
                            className="rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            Use original
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={removeImage}
                          className="rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          Remove background (free)
                        </p>
                        <p className="text-xs text-slate-500">
                          Cuts out your product and places it on a clean white background.
                        </p>
                      </div>
                      <Button type="button" onClick={handleEnhancePhoto} disabled={enhancing}>
                        {enhancing
                          ? "Removing… (first run may take a minute)"
                          : "Remove background"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition hover:border-white/25 hover:bg-white/[0.04]">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={uploadingImage}
                  />
                  <span className="text-sm font-medium text-slate-300">
                    {uploadingImage ? "Uploading…" : "Click to upload a product photo"}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    JPG, PNG, WebP, or GIF · up to 5 MB
                  </span>
                </label>
              )}
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-foreground">Product name</span>
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                placeholder="e.g. Choco Fudge Cake"
              />
            </label>

            {draft.shortDescription ? (
              <p className="text-sm text-muted-foreground">{draft.shortDescription}</p>
            ) : null}

            <label className="block">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={enhancingDescription || !draft.title.trim()}
                  onClick={() => void handleEnhanceDescription()}
                >
                  {enhancingDescription ? "Enhancing…" : "Enhance with AI"}
                </Button>
              </div>
              <textarea
                value={htmlToPlainDescription(draft.descriptionHtml)}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          descriptionHtml: plainDescriptionToHtml(e.target.value),
                          shortDescription: e.target.value.split("\n")[0] ?? "",
                        }
                      : d
                  )
                }
                rows={4}
                placeholder="Write your own description. AI can polish it after."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              />
              {descriptionNote ? (
                <p className="mt-1.5 text-xs text-slate-400">{descriptionNote}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  Optional: AI rewrites for clarity and selling tone — you stay in control.
                </p>
              )}
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-foreground">Price (PHP)</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={draft.basePrice}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, basePrice: e.target.value } : d))
                  }
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-foreground">
                  Compare-at (optional)
                </span>
                <input
                  type="number"
                  min="1"
                  value={draft.compareAtPrice}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, compareAtPrice: e.target.value } : d))
                  }
                  placeholder="499"
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-foreground">Stock</span>
                <input
                  type="number"
                  min="0"
                  value={draft.stockQty}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, stockQty: e.target.value } : d))
                  }
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={suggestingPrice || !draft.title.trim()}
                onClick={() => void handleSuggestPrice()}
              >
                {suggestingPrice ? "Checking nearby prices…" : "Suggest nearby price"}
              </Button>
              {pricingNote ? (
                <p className="max-w-xl text-sm text-slate-400">{pricingNote}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  AI estimates a competitive price for similar products nearby.
                </p>
              )}
            </div>

            <label className="block sm:max-w-xs">
              <span className="mb-1 block text-sm font-medium text-foreground">Status</span>
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft((d) =>
                    d ? { ...d, status: e.target.value as "draft" | "active" } : d
                  )
                }
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="active">Active (visible on storefront)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Save product"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {notice && (
        <p className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100/90">
          {notice}
        </p>
      )}
      {error && !showForm && (
        <p className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading products…</p>
      ) : products.length === 0 && !showForm ? (
        <Card className="border-dashed border-white/15 bg-white/[0.02]">
          <p className="font-medium text-slate-100">No products yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Add your first product with a name, price, and photo. AI can help polish the
            description or suggest a nearby price afterward.
          </p>
          <Button type="button" className="mt-4" onClick={openCreateForm}>
            + Add product
          </Button>
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
                  className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs text-slate-500">
                  No photo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-100">{product.title}</h3>
                  <Badge
                    className={
                      product.status === "active"
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.04] text-slate-400"
                    }
                  >
                    {product.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {formatPrice(Number(product.basePrice))} · Stock: {product.stockQty} · /
                  {product.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(product)}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.05]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                  disabled={deletingId === product.id}
                  className="rounded-xl px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deletingId === product.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
