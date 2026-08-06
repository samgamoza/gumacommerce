"use client";

import { useState, useTransition } from "react";
import { replySupportTicketAction, updateSupportTicketAction } from "@/app/actions";

export function HelpdeskTicketActions({
  ticketId,
  status,
  priority,
}: {
  ticketId: string;
  status: string;
  priority: string;
}) {
  const [pending, startTransition] = useTransition();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setNotice(okMsg);
        if (okMsg.startsWith("Reply")) setReply("");
      } else {
        setError(res.error ?? "Action failed.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          onClick={() =>
            run(
              () => updateSupportTicketAction(ticketId, { assignToMe: true }),
              "Assigned to you."
            )
          }
        >
          Assign to me
        </button>
        {status !== "in_progress" && (
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            onClick={() =>
              run(
                () => updateSupportTicketAction(ticketId, { status: "in_progress" }),
                "Marked in progress."
              )
            }
          >
            In progress
          </button>
        )}
        {status !== "pending" && (
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            onClick={() =>
              run(
                () => updateSupportTicketAction(ticketId, { status: "pending" }),
                "Waiting on requester."
              )
            }
          >
            Pending
          </button>
        )}
        {status !== "resolved" && (
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            onClick={() =>
              run(
                () => updateSupportTicketAction(ticketId, { status: "resolved" }),
                "Ticket resolved."
              )
            }
          >
            Resolve
          </button>
        )}
        {status !== "closed" && (
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            onClick={() =>
              run(() => updateSupportTicketAction(ticketId, { status: "closed" }), "Ticket closed.")
            }
          >
            Close
          </button>
        )}
        {priority !== "urgent" && (
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
            onClick={() =>
              run(
                () => updateSupportTicketAction(ticketId, { priority: "urgent" }),
                "Marked urgent."
              )
            }
          >
            Mark urgent
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border p-4">
        <label className="block text-sm font-medium">
          {internal ? "Internal note" : "Reply to requester"}
          <textarea
            className="mt-2 min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={internal ? "Visible only to agents…" : "Write a clear, helpful reply…"}
          />
        </label>
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={internal}
            onChange={(e) => setInternal(e.target.checked)}
          />
          Internal note (not visible to requester)
        </label>
        <button
          type="button"
          disabled={pending || !reply.trim()}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          onClick={() =>
            run(
              () => replySupportTicketAction(ticketId, reply, internal),
              internal ? "Internal note saved." : "Reply sent."
            )
          }
        >
          {pending ? "Sending…" : internal ? "Add note" : "Send reply"}
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}
    </div>
  );
}
