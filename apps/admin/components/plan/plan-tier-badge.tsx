import type { SubscriptionPlan } from "@/lib/plan-access";
import { planBadgeLabel } from "@/lib/plan-access";

export function PlanTierBadge({
  tier,
  className = "",
}: {
  tier: SubscriptionPlan;
  className?: string;
}) {
  if (tier === "free") return null;

  return (
    <span
      className={`inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500 ${className}`}
    >
      {planBadgeLabel(tier)}
    </span>
  );
}
