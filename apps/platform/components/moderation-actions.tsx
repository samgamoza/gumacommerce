"use client";

import { useState, useTransition } from "react";
import { Check, Flag, FlagOff, Loader2, X } from "lucide-react";
import { moderateContentAction } from "@/app/actions";

export function ModerationActions({
  itemId,
  label,
  status,
  flagged,
}: {
  itemId: string;
  label: string;
  status: string;
  flagged: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(input: { status?: "draft" | "approved" | "skipped"; flagged?: boolean; note?: string }) {
    setError(null);
    startTransition(async () => {
      const res = await moderateContentAction(itemId, input, label);
      if (!res.ok) setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-xs text-rose-600">{error}</span>}
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}

      {status !== "approved" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ status: "approved", flagged: false })}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </button>
      )}
      {status !== "skipped" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ status: "skipped" })}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
      )}
      {flagged ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ flagged: false })}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-50"
        >
          <FlagOff className="h-3.5 w-3.5" />
          Unflag
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const note = prompt("Reason for flagging (optional):") ?? undefined;
            run({ flagged: true, note });
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <Flag className="h-3.5 w-3.5" />
          Flag
        </button>
      )}
    </div>
  );
}
