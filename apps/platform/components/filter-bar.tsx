"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

export interface SelectFilter {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

export function FilterBar({
  basePath,
  searchPlaceholder = "Search…",
  selects = [],
}: {
  basePath: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");

  function apply(next: Record<string, string>) {
    const merged = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    startTransition(() => {
      router.push(`${basePath}?${merged.toString()}`);
    });
  }

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ search });
        }}
        className="relative flex-1"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </form>

      {selects.map((select) => (
        <select
          key={select.name}
          value={params.get(select.name) ?? ""}
          onChange={(e) => apply({ [select.name]: e.target.value })}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          <option value="">{select.label}</option>
          {select.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {pending && <span className="text-xs text-muted-foreground">…</span>}
    </div>
  );
}
