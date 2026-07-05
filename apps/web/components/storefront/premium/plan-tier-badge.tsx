import type { StorePlan } from "@/lib/storefront-plans";

export function PlanTierBadge({
  tier,
  className = "",
}: {
  tier: Exclude<StorePlan, "free">;
  className?: string;
}) {
  const isPro = tier === "pro";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{
        background: isPro
          ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
          : "linear-gradient(135deg, #34d399, #059669)",
        color: isPro ? "#422006" : "#fff",
        boxShadow: isPro
          ? "0 2px 8px rgba(251,191,36,0.35)"
          : "0 2px 8px rgba(5,150,105,0.3)",
      }}
    >
      {isPro ? "👑 Pro" : "⚡ Growth"}
    </span>
  );
}
