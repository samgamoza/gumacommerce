"use client";

import { SHOP_VIBES } from "@guma-commerce/storefront-themes";

export function VibePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (vibe: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        Pick your shop&apos;s vibe
      </span>
      <p className="mb-2 text-xs text-muted-foreground">
        We&apos;ll design a unique starting look around it — you can change everything later.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SHOP_VIBES.map((vibe) => {
          const selected = value === vibe.id;
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => onChange(selected ? "" : vibe.id)}
              className={`rounded-xl border p-2.5 text-left transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-border bg-card hover:border-border"
              }`}
            >
              <p className="text-sm font-medium text-foreground">
                {vibe.emoji} {vibe.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{vibe.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
