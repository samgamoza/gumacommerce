"use client";

import { useState, useTransition } from "react";
import { Ban, RotateCcw } from "lucide-react";
import { updateUserRoleAction, updateUserStatusAction } from "@/app/actions";

const ROLES = [
  { value: "super_admin", label: "Super admin" },
  { value: "seller_owner", label: "Seller owner" },
  { value: "seller_staff", label: "Seller staff" },
  { value: "customer", label: "Customer" },
];

export function UserActions({
  userId,
  label,
  role,
  status,
  isSelf,
}: {
  userId: string;
  label: string;
  role: string;
  status: string;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const suspended = status === "suspended";

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Failed");
    });
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-rose-600">{error}</span>}
      <select
        value={role}
        disabled={pending}
        onChange={(e) => run(() => updateUserRoleAction(userId, e.target.value, label))}
        className="h-8 rounded-lg border border-border bg-card px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {suspended ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => updateUserStatusAction(userId, "active", label))}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reactivate
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Suspend ${label}? They will be signed out and blocked.`)) {
              run(() => updateUserStatusAction(userId, "suspended", label));
            }
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <Ban className="h-3.5 w-3.5" />
          Suspend
        </button>
      )}
    </div>
  );
}
