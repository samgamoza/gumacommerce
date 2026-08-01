"use client";

import Link from "next/link";
import { Gem, X } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/plan-access";
import { PLAN_DISPLAY, upgradeHref } from "@/lib/plan-access";

export function UpgradeGateModal({
  open,
  onClose,
  requiredPlan,
  featureTitle,
  featureDescription,
  refSource,
}: {
  open: boolean;
  onClose: () => void;
  requiredPlan: Exclude<SubscriptionPlan, "free">;
  featureTitle: string;
  featureDescription?: string;
  refSource?: string;
}) {
  if (!open) return null;

  const planName = PLAN_DISPLAY[requiredPlan];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-gate-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
          <Gem className="h-7 w-7" />
        </div>

        <h2 id="upgrade-gate-title" className="mt-5 text-xl font-bold text-foreground">
          Unlock {featureTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {featureDescription ??
            `This feature is available on the ${planName} plan or higher. Upgrade to keep building without limits.`}
        </p>

        <Link
          href={upgradeHref(requiredPlan, refSource)}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-orange-600"
        >
          Upgrade to {planName}
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
