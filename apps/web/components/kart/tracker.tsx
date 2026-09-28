"use client";

import { Check, Bike, PackageCheck, Package, Lock, Home } from "lucide-react";
import { TRACK_STEPS, type TrackStepKey } from "@/lib/kart/demo";

const ICONS = { locked: Lock, packing: Package, handed: PackageCheck, otd: Bike, arrived: Home } as const;

/* BayanGo active tracker: horizontal on wide screens, vertical on phones (spec §D). */
export function Tracker({ current }: { current: TrackStepKey }) {
  const idx = TRACK_STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="grid gap-0 sm:grid-cols-5 sm:gap-2">
      {TRACK_STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const Icon = ICONS[s.key];
        return (
          <li key={s.key} className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center">
            {/* connector */}
            {i < TRACK_STEPS.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 sm:left-1/2 sm:top-4 sm:h-0.5 sm:w-full ${
                  done ? "bg-[color:var(--kart-orange)]" : "bg-slate-200"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                done
                  ? "border-[color:var(--kart-orange)] bg-[color:var(--kart-orange)] text-white"
                  : active
                  ? "border-[color:var(--kart-orange)] bg-white text-[color:var(--kart-orange)]"
                  : "border-slate-200 bg-white text-slate-300"
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className={`h-4 w-4 ${active ? "k-pulse" : ""}`} />}
            </span>
            <span className="pb-6 sm:pb-0 sm:pt-2">
              <span className={`block text-sm font-bold ${active || done ? "text-[color:var(--kart-ink)]" : "text-slate-400"}`}>{s.label}</span>
              <span className="block text-xs text-[color:var(--kart-muted)]">{active ? s.hint : done ? "Done" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
