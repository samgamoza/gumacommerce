import type { ReactNode } from "react";
import type { ResolvedShopTheme } from "@guma-commerce/storefront-themes";
import {
  normalizeStorePlan,
  planAtLeast,
  type StorePlan,
} from "@/lib/storefront-plans";
import { PlanTierBadge } from "./plan-tier-badge";

export function FeatureGate({
  required,
  plan,
  theme,
  children,
  teaser,
  upgradeHref,
}: {
  required: Exclude<StorePlan, "free">;
  plan?: string | null;
  theme: ResolvedShopTheme;
  children: ReactNode;
  teaser: ReactNode;
  upgradeHref: string;
}) {
  const current = normalizeStorePlan(plan);

  if (planAtLeast(current, required)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(2px)", opacity: 0.55 }}
        aria-hidden
      >
        {teaser}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl px-4 py-6 text-center backdrop-blur-[2px]"
        style={{
          borderRadius: theme.radius,
          background: `${theme.background}cc`,
          border: `1px dashed ${theme.primaryColor}55`,
        }}
      >
        <PlanTierBadge tier={required} />
        <p className="max-w-xs text-sm font-medium">
          {required === "pro"
            ? "Live selling, AI chat & advanced layouts"
            : "Flash deals, reviews & Growth templates"}
        </p>
        <a
          href={upgradeHref}
          className="rounded-full px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-90"
          style={{ backgroundColor: theme.primaryColor }}
        >
          Upgrade to {required === "pro" ? "Pro" : "Growth"}
        </a>
      </div>
    </div>
  );
}
