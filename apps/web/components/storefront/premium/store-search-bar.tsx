"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { ResolvedShopTheme } from "@guma-commerce/storefront-themes";

const PLACEHOLDERS = [
  "Search products…",
  "Try “best seller”…",
  "Find bundles & deals…",
];

export function StoreSearchBar({
  theme,
  value,
  onChange,
}: {
  theme: ResolvedShopTheme;
  value: string;
  onChange: (value: string) => void;
}) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: theme.muted }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDERS[placeholderIdx]}
        className="w-full py-2.5 pl-10 pr-4 text-sm outline-none transition focus:outline-2"
        style={{
          borderRadius: theme.radius,
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.cardBackground,
          color: theme.foreground,
          outlineColor: theme.primaryColor,
        }}
      />
    </div>
  );
}
