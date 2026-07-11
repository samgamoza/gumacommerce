"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DemoTenant } from "@/lib/demo-data";

interface StorefrontExperienceContextValue {
  tenant: DemoTenant;
  search: string;
  setSearch: (value: string) => void;
  activeCategory: string | null;
  setActiveCategory: (slug: string | null) => void;
}

const StorefrontExperienceContext = createContext<StorefrontExperienceContextValue | null>(
  null
);

export function StorefrontExperienceProvider({
  tenant,
  children,
}: {
  tenant: DemoTenant;
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const value = useMemo(
    () => ({ tenant, search, setSearch, activeCategory, setActiveCategory }),
    [tenant, search, activeCategory]
  );

  return (
    <StorefrontExperienceContext.Provider value={value}>
      {children}
    </StorefrontExperienceContext.Provider>
  );
}

export function useStorefrontExperience(): StorefrontExperienceContextValue {
  const ctx = useContext(StorefrontExperienceContext);
  if (!ctx) {
    throw new Error("useStorefrontExperience must be used within StorefrontExperienceProvider");
  }
  return ctx;
}
