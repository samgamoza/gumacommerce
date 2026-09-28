"use client";

import { Check } from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/kart/demo";

/* High-contrast radio cards with brand identifiers (spec §C.3). */
export function PaymentPicker({ value, onChange }: { value: PaymentMethod | null; onChange: (m: PaymentMethod) => void }) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="grid gap-3">
      {PAYMENT_METHODS.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.id)}
            className={`flex items-center gap-3 rounded-xl border-2 bg-white p-3.5 text-left transition-colors ${
              active ? "border-[color:var(--kart-ink)]" : "border-[color:var(--kart-line)] hover:border-slate-400"
            }`}
          >
            <BrandMark method={m.id} />
            <span className="flex-1">
              <span className="block text-sm font-bold">{m.label}</span>
              <span className={`block text-xs ${m.id === "cod" ? "font-medium text-[color:var(--kart-orange-dark)]" : "text-[color:var(--kart-muted)]"}`}>
                {m.note}
              </span>
            </span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                active ? "border-[color:var(--kart-ink)] bg-[color:var(--kart-ink)] text-white" : "border-slate-300"
              }`}
            >
              {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BrandMark({ method }: { method: PaymentMethod }) {
  if (method === "gcash")
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white" style={{ background: "var(--kart-gcash)" }}>
        G
      </span>
    );
  if (method === "maya")
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white" style={{ background: "var(--kart-maya)" }}>
        M
      </span>
    );
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    </span>
  );
}
