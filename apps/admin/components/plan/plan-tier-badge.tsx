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
      className={`inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ${className}`}
    >
      {planBadgeLabel(tier)}
    </span>
  );
}
