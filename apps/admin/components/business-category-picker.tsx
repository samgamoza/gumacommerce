"use client";

import { useMemo, useState } from "react";
import {
  emojiForGuideCategory,
  groupCategoriesForOnboarding,
  matchBusinessCategories,
} from "@guma-commerce/storefront-themes";

/** Most common FB / Shopee / Lazada seller starts — short shortcuts only. */
const QUICK_PICKS = [
  "Food & Beverage",
  "Fashion & Apparel",
  "Beauty & Skincare",
  "Grocery & Supermarket",
  "Home Services & Trades",
] as const;

export function BusinessCategoryPicker({
  value,
  onChange,
  allowedCategories,
  id = "category",
}: {
  value: string;
  onChange: (category: string) => void;
  allowedCategories: string[];
  id?: string;
}) {
  const [filter, setFilter] = useState("");

  const groups = useMemo(
    () => groupCategoriesForOnboarding(allowedCategories),
    [allowedCategories]
  );

  const quickPicks = useMemo(
    () => QUICK_PICKS.filter((label) => allowedCategories.includes(label)),
    [allowedCategories]
  );

  const filterHits = useMemo(() => {
    const q = filter.trim();
    if (q.length < 1) return [];
    return matchBusinessCategories(q, {
      allowedLabels: allowedCategories,
      limit: 8,
      minScore: 40,
    });
  }, [filter, allowedCategories]);

  const showFilterResults = filter.trim().length >= 1;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          Business category
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Same idea as Facebook, Shopee, or Lazada — pick the category you already use.
        </p>
      </div>

      {quickPicks.length > 0 && !showFilterResults && (
        <div className="flex flex-wrap gap-2">
          {quickPicks.map((label) => {
            const active = value === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange(label)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-card text-foreground hover:border-emerald-400"
                }`}
              >
                {emojiForGuideCategory(label)} {label}
              </button>
            );
          })}
        </div>
      )}

      <input
        id={`${id}-filter`}
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Find category…"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-emerald-500/30 placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-2"
        autoComplete="off"
      />

      {showFilterResults ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {filterHits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No match — clear the search and pick from the list below.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filterHits.map((m) => (
                <li key={m.label}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(m.label);
                      setFilter("");
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-emerald-50 ${
                      value === m.label ? "bg-emerald-50 font-semibold" : "font-medium"
                    }`}
                  >
                    <span aria-hidden>{emojiForGuideCategory(m.label)}</span>
                    <span>{m.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <select
        id={id}
        name="category"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
      >
        <option value="">Choose your category…</option>
        {groups.map(({ group, entries }) => (
          <optgroup key={group.id} label={group.label}>
            {entries.map((entry) => (
              <option key={entry.label} value={entry.label}>
                {entry.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {!value && (
        <p className="text-xs text-amber-700">Choose a category to continue.</p>
      )}
    </div>
  );
}
