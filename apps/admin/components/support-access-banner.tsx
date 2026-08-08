"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export function SupportAccessBanner({
  tenantName,
  tenantSlug,
}: {
  tenantName?: string | null;
  tenantSlug?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function exitSupport() {
    setPending(true);
    try {
      const res = await fetch("/api/auth/exit-support", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; redirectTo?: string };
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }
      router.push("/login");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative z-40 border-b border-amber-500/40 bg-amber-500 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Support access — you are in{" "}
          <span className="underline decoration-amber-800/40">
            {tenantName ?? "this shop"}
            {tenantSlug ? ` (/${tenantSlug})` : ""}
          </span>{" "}
          as platform ops. Actions are audited.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={exitSupport}
          className="rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-semibold text-amber-50 disabled:opacity-60"
        >
          {pending ? "Leaving…" : "Exit to Platform"}
        </button>
      </div>
    </div>
  );
}
