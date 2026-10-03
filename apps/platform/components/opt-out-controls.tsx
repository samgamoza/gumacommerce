"use client";

import { useState, useTransition } from "react";
import { addSmsOptOutAction, removeSmsOptOutAction } from "@/app/actions";

export function AddOptOutForm() {
  const [phone, setPhone] = useState("");
  const [scope, setScope] = useState<"marketing" | "all">("marketing");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await addSmsOptOutAction({ phone, scope });
          if (res.ok) {
            setPhone("");
            setMessage({ ok: true, text: "Opt-out saved." });
          } else {
            setMessage({ ok: false, text: res.error });
          }
        });
      }}
    >
      <label className="text-sm">
        Mobile number
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09XX XXX XXXX"
          className="mt-1 block h-10 w-48 rounded-lg border border-border bg-background px-3 text-sm"
        />
      </label>
      <label className="text-sm">
        Stop
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as "marketing" | "all")}
          className="mt-1 block h-10 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="marketing">Reminders only</option>
          <option value="all">All texts (incl. order updates)</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending || phone.trim().length < 10}
        className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add opt-out"}
      </button>
      {message ? (
        <p className={`w-full text-sm ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>
      ) : null}
    </form>
  );
}

export function RemoveOptOutButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Allow texts to ${label} again?`)) return;
        startTransition(async () => {
          await removeSmsOptOutAction(id, label);
        });
      }}
      className="text-xs font-medium text-muted-foreground hover:text-red-600 disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
