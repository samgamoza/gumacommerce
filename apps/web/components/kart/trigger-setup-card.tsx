"use client";

import { useState } from "react";
import { Radio, AlertTriangle } from "lucide-react";
import { DEFAULT_TRIGGER, peso, type TriggerConfig } from "@/lib/kart/demo";
import { DmCard } from "./dm-card";
import { Field, Pill, Switch } from "./ui";

/*
  Merchant "Keyword Trigger Setup" card (spec §A) with a live DM preview.
  Orange is reserved for the one high-priority execution state: arming the listener.
*/
export function TriggerSetupCard() {
  const [cfg, setCfg] = useState<TriggerConfig>(DEFAULT_TRIGGER);
  const set = (patch: Partial<TriggerConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const valid = cfg.keyword.trim().length >= 2 && cfg.title.trim() && cfg.price > 0 && cfg.stock > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form className="k-card grid gap-5 p-5 lg:col-span-3" onSubmit={(e) => e.preventDefault()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Keyword trigger</h2>
            <p className="text-sm text-[color:var(--kart-muted)]">When a comment matches, the bot DMs a checkout link.</p>
          </div>
          <Pill tone={cfg.listenerOn ? "orange" : "neutral"}>
            <Radio className={`h-3.5 w-3.5 ${cfg.listenerOn ? "k-pulse" : ""}`} />
            {cfg.listenerOn ? "Listening" : "Off"}
          </Pill>
        </div>

        <Field label="Trigger keyword" hint="Case-insensitive. Buyers comment this word on your post or live.">
          <input
            className="k-input font-mono font-bold uppercase tracking-wider"
            value={cfg.keyword}
            maxLength={12}
            onChange={(e) => set({ keyword: e.target.value.toUpperCase() })}
            placeholder="MINE"
          />
        </Field>

        <Field label="Product title">
          <input className="k-input" value={cfg.title} onChange={(e) => set({ title: e.target.value })} placeholder="Vintage Corduroy Jacket" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Retail price">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-3 text-base font-bold text-slate-500">₱</span>
              <input
                className="k-input font-semibold"
                style={{ paddingLeft: "2.1rem" }}
                inputMode="decimal"
                value={cfg.price || ""}
                onChange={(e) => set({ price: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })}
                placeholder="0"
              />
            </div>
          </Field>
          <Field label="Inventory count">
            <div className="flex h-12 items-stretch overflow-hidden rounded-xl border-[1.5px] border-[color:var(--kart-line)] bg-white">
              <button type="button" className="w-12 text-xl font-bold text-slate-600 hover:bg-slate-50" onClick={() => set({ stock: Math.max(0, cfg.stock - 1) })} aria-label="Decrease">
                −
              </button>
              <input
                className="w-full border-x border-[color:var(--kart-line)] text-center text-base font-bold outline-none"
                inputMode="numeric"
                value={cfg.stock}
                onChange={(e) => set({ stock: Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0) })}
              />
              <button type="button" className="w-12 text-xl font-bold text-slate-600 hover:bg-slate-50" onClick={() => set({ stock: cfg.stock + 1 })} aria-label="Increase">
                +
              </button>
            </div>
          </Field>
        </div>

        {/* Safety toggle — sticky on phones so it is never scrolled away */}
        <div
          className={`sticky bottom-3 z-10 flex items-center gap-4 rounded-2xl border-2 p-4 shadow-lg shadow-black/5 ${
            cfg.listenerOn ? "border-[color:var(--kart-orange)] bg-[color:var(--kart-orange-soft)]" : "border-[color:var(--kart-line)] bg-white"
          }`}
        >
          <div className="flex-1">
            <p className="text-base font-extrabold">Activate Auto-DM Listener</p>
            <p className="text-xs text-[color:var(--kart-muted)]">
              {cfg.listenerOn
                ? `Watching comments for "${cfg.keyword}" on the selected post / live.`
                : "Deploys the webhook to the selected post or live video."}
            </p>
          </div>
          <Switch on={cfg.listenerOn} onChange={(v) => valid && set({ listenerOn: v })} label="Activate Auto-DM Listener" />
        </div>
        {!valid && (
          <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-[color:var(--kart-orange-dark)]">
            <AlertTriangle className="h-3.5 w-3.5" /> Fill in keyword, title, price and stock to arm the listener.
          </p>
        )}
      </form>

      <aside className="lg:col-span-2">
        <div className="k-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--kart-muted)]">Live preview · what buyers receive</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3">
            <p className="mb-3 self-end text-right">
              <span className="inline-block rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2 text-[15px] text-white">{cfg.keyword || "MINE"}</span>
            </p>
            <DmCard buyer="Marites" title={cfg.title || "Your product"} price={cfg.price || 0} compact />
          </div>
          <p className="mt-3 text-xs text-[color:var(--kart-muted)]">
            {cfg.stock} in stock · {peso(cfg.price || 0)} each · link expires 30 min after it is sent.
          </p>
        </div>
      </aside>
    </div>
  );
}
