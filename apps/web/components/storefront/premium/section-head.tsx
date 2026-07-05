import Link from "next/link";
import type { ResolvedShopTheme } from "@guma-commerce/storefront-themes";
import type { StorePlan } from "@/lib/storefront-plans";
import { PlanTierBadge } from "./plan-tier-badge";

export function PremiumSectionHead({
  title,
  theme,
  tier,
  subtitle,
  upgradeHref,
  extra,
}: {
  title: string;
  theme: ResolvedShopTheme;
  tier?: Exclude<StorePlan, "free">;
  subtitle?: string;
  upgradeHref?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {tier && <PlanTierBadge tier={tier} />}
        {extra}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs" style={{ color: theme.muted }}>
          {subtitle}
          {upgradeHref && (
            <>
              {" "}
              <Link
                href={upgradeHref}
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: theme.primaryColor }}
              >
                unlock when you upgrade →
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
