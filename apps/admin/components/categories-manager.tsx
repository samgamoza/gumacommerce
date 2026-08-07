"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@guma-commerce/ui";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setLoading(false);
    if (data.ok) setCategories(data.categories);
    else setError(data.error ?? "Could not load categories.");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.ok) {
      setError(data.error ?? "Could not create category.");
      return;
    }

    setName("");
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in it will stay uncategorized.")) return;

    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "Could not delete category.");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/25 bg-emerald-500/10 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            🏷️
          </span>
          <h2 className="text-lg font-semibold text-foreground">Product categories</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize your catalog like a real Shopify store. Categories appear in your shop menu and
          help customers browse faster.
        </p>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Card className="p-5">
        <h3 className="font-medium text-foreground">Add category</h3>
        <form onSubmit={handleCreate} className="mt-3 flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cakes, Best Sellers, Custom Prints"
            className="h-10 min-w-[240px] flex-1 rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add category"}
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-medium text-foreground">Your categories</h3>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            No categories yet. Add one to group products on your storefront menu.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="text-xs text-muted-foreground">/{category.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-muted text-foreground">
                    {category.productCount} product{category.productCount === 1 ? "" : "s"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
