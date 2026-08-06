"use client";

import { useMemo, useState } from "react";
import {
  emojiForGuideCategory,
  getCategoryGuideEntry,
  groupCategoriesForOnboarding,
  guideEntryOrFallback,
  matchBusinessCategories,
  popularCategoryLabels,
} from "@guma-commerce/storefront-themes";

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
  const [query, setQuery] = useState("");
  const [browseOpen, setBrowseOpen] = useState(false);

  const popular = useMemo(
    () => popularCategoryLabels(allowedCategories),
    [allowedCategories]
  );

  const matches = useMemo(
    () => matchBusinessCategories(query, { allowedLabels: allowedCategories, limit: 6 }),
    [query, allowedCategories]
  );

  const groups = useMemo(
    () => groupCategoriesForOnboarding(allowedCategories),
    [allowedCategories]
  );

  const selected = value ? guideEntryOrFallback(value) : null;
  const showSearchResults = query.trim().length >= 2;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${id}-search`} className="block text-sm font-medium text-foreground">
          What kind of business are you building?
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Describe it in plain words — we&apos;ll point you to the right home. You can change this
          later.
        </p>
      </div>

      <div className="relative">
        <input
          id={`${id}-search`}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setBrowseOpen(false);
          }}
          onFocus={() => {
            if (!query.trim()) setBrowseOpen(false);
          }}
          placeholder='Try “life insurance”, “milk tea”, “nail salon”…'
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-emerald-500/30 placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-2"
          autoComplete="off"
        />
      </div>

      {showSearchResults && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No close match yet — browse below, or pick{" "}
              <button
                type="button"
                className="font-medium text-emerald-700 underline"
                onClick={() => {
                  onChange("General");
                  setQuery("");
                }}
              >
                General
              </button>{" "}
              and refine later.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {matches.map((m) => (
                <li key={m.label}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(m.label);
                      setQuery("");
                    }}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-emerald-50 ${
                      value === m.label ? "bg-emerald-50" : ""
                    }`}
                  >
                    <span className="text-xl leading-none">{emojiForGuideCategory(m.label)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">{m.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {m.entry.plain}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-emerald-700">
                        {m.reason}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!showSearchResults && popular.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Popular starts
          </p>
          <div className="flex flex-wrap gap-2">
            {popular.map((label) => {
              const entry = getCategoryGuideEntry(label);
              const selectedChip = value === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange(label)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selectedChip
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-border bg-card text-foreground hover:border-emerald-400"
                  }`}
                  title={entry?.plain}
                >
                  {emojiForGuideCategory(label)} {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!showSearchResults && (
        <div>
          <button
            type="button"
            onClick={() => setBrowseOpen((o) => !o)}
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {browseOpen ? "Hide full list" : "Browse all categories"}
          </button>

          {browseOpen && (
            <div className="mt-3 max-h-72 space-y-4 overflow-y-auto rounded-xl border border-border p-3">
              {groups.map(({ group, entries }) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <p className="mb-2 text-[11px] text-muted-foreground">{group.blurb}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {entries.map((entry) => {
                      const active = value === entry.label;
                      return (
                        <button
                          key={entry.label}
                          type="button"
                          onClick={() => {
                            onChange(entry.label);
                            setBrowseOpen(false);
                          }}
                          className={`rounded-xl border p-2.5 text-left transition ${
                            active
                              ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                              : "border-border hover:border-emerald-400"
                          }`}
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {emojiForGuideCategory(entry.label)} {entry.label}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                            {entry.plain}
                          </p>
                          {entry.examples.length > 0 && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              e.g. {entry.examples.slice(0, 3).join(" · ")}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
            Your category
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {emojiForGuideCategory(selected.label)} {selected.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{selected.plain}</p>
          <input type="hidden" id={id} name="category" value={value} readOnly />
        </div>
      )}

      {!value && (
        <p className="text-xs text-amber-700">Pick a category so we can set up the right shop look.</p>
      )}
    </div>
  );
}
