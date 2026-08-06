"use client";

import Link from "next/link";
import { storefrontBaseUrl } from "@/lib/utils";

const SUPPORT_CONTACT =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support via platform Helpdesk";

export function SuspendedShopNotice({
  tenantName,
  tenantSlug,
  onLogout,
}: {
  tenantName?: string;
  tenantSlug?: string;
  onLogout: () => void;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-guma-navy px-6 py-16 text-center text-slate-200">
      <div className="pointer-events-none fixed inset-0 grid-bg grid-bg-fade opacity-20" />
      <div className="relative max-w-md space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
          Shop suspended
        </p>
        <h1 className="text-2xl font-bold text-white">
          {tenantName ? `${tenantName} is suspended` : "Your shop is suspended"}
        </h1>
        <p className="text-sm leading-relaxed text-slate-300">
          Your shop is suspended — contact support to resolve this. Product edits, new
          bookings, and settings changes are blocked until the shop is reactivated.
        </p>
        <p className="text-xs text-slate-400">
          Existing buyer order tracking and payment proof uploads may still work so you
          can settle open orders. Reach {SUPPORT_CONTACT} for reactivation.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {tenantSlug ? (
            <Link
              href={`${storefrontBaseUrl}/${tenantSlug}`}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              View storefront status
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-guma-navy transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
