"use client";

import Link from "next/link";
import { Gem } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/plan-access";
import { PLAN_DISPLAY, planAtLeast, upgradeHref } from "@/lib/plan-access";
import { PlanTierBadge } from "@/components/plan/plan-tier-badge";

export function PlanGatedPage({
  title,
  description,
  requiredPlan,
  currentPlan,
  previewCards,
  refSource,
}: {
  title: string;
  description: string;
  requiredPlan: SubscriptionPlan;
  currentPlan: SubscriptionPlan;
  previewCards: string[];
  refSource?: string;
}) {
  const unlocked = planAtLeast(currentPlan, requiredPlan);

  if (unlocked) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
        <p className="text-sm font-medium text-emerald-800">
          {title} is unlocked on your {PLAN_DISPLAY[currentPlan]} plan.
        </p>
        <p className="mt-2 text-sm text-emerald-700/80">
          Full {title.toLowerCase()} tools are coming in the next update — you&apos;ll paste feature
          specs in your follow-up prompts.
        </p>
      </div>
    );
  }

  const highlight = requiredPlan === "pro" ? "pro" : "growth";

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-3 p-6 sm:grid-cols-2" aria-hidden>
        {previewCards.map((card) => (
          <div
            key={card}
            className="rounded-xl border border-border bg-muted px-4 py-8 text-sm font-medium text-muted-foreground"
          >
            {card}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-card/75 p-6 backdrop-blur-[3px]">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Gem className="h-6 w-6" />
          </div>
          <div className="mt-4 flex justify-center">
            <PlanTierBadge tier={requiredPlan} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">Unlock {title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <Link
            href={upgradeHref(highlight, refSource)}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Upgrade to {PLAN_DISPLAY[requiredPlan]}
          </Link>
        </div>
      </div>
    </div>
  );
}
