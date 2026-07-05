"use client";

import { useState, useTransition } from "react";
import { Ban, Check, CircleSlash, ExternalLink, Loader2 } from "lucide-react";
import { CLIENT_PLANS } from "@/lib/plans";
import { updateTenantPlanAction, updateTenantStatusAction } from "@/app/actions";

export function TenantActions({
  tenantId,
  name,
  status,
  plan,
  shopUrl,
}: {
  tenantId: string;
  name: string;
  status: string;
  plan: string;
  shopUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState(plan);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) setMessage({ tone: "ok", text: success });
      else setMessage({ tone: "err", text: res.error ?? "Action failed." });
    });
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            message.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Status controls */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </p>
        <div className="flex flex-wrap gap-2">
          {status !== "active" && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => updateTenantStatusAction(tenantId, "active", name), "Shop activated.")
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Activate
            </button>
          )}
          {status !== "pending" && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => updateTenantStatusAction(tenantId, "pending", name),
                  "Shop set to pending."
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <CircleSlash className="h-4 w-4" />
              Set pending
            </button>
          )}
          {status !== "suspended" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm(`Suspend "${name}"? Its storefront will go offline.`)) {
                  run(
                    () => updateTenantStatusAction(tenantId, "suspended", name),
                    "Shop suspended."
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Plan control */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Subscription plan
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            {CLIENT_PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · ₱{p.priceMonthly}/mo
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || selectedPlan === plan}
            onClick={() =>
              run(
                () => updateTenantPlanAction(tenantId, selectedPlan, name),
                "Subscription plan updated."
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save plan
          </button>
        </div>
      </div>

      <a
        href={shopUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold transition hover:bg-muted"
      >
        <ExternalLink className="h-4 w-4" />
        View storefront
      </a>
    </div>
  );
}
