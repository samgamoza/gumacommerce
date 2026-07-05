"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ResolvedShopTheme } from "@guma-commerce/storefront-themes";
import { upgradeUrl } from "@/lib/storefront-plans";
import { PlanTierBadge } from "./plan-tier-badge";

export function LockedAssistantFab({ theme }: { theme: ResolvedShopTheme }) {
  return (
    <Link
      href={upgradeUrl("pro")}
      className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-1 md:bottom-8"
      aria-label="AI shop assistant — Pro feature"
    >
      <PlanTierBadge tier="pro" />
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105"
        style={{ backgroundColor: theme.primaryColor }}
      >
        <MessageCircle className="h-7 w-7" />
      </span>
    </Link>
  );
}
