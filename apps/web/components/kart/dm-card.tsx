"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { dmMessage, peso } from "@/lib/kart/demo";

/*
  The bot's reply inside Messenger / IG / TikTok DMs (spec §B):
  plain text line + one un-missable slate card with a single CTA.
*/
export function DmCard({
  buyer,
  title,
  price,
  href = "/kart/checkout",
  compact = false,
}: {
  buyer: string;
  title: string;
  price: number;
  href?: string;
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-2 ${compact ? "max-w-[300px]" : "max-w-sm"}`}>
      <p className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-[15px] leading-snug text-slate-900">
        {dmMessage(buyer, title, price)}
      </p>
      <div className="overflow-hidden rounded-2xl rounded-bl-md text-white" style={{ background: "var(--kart-slate)" }}>
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Reserved for you</p>
            <p className="mt-0.5 text-base font-extrabold leading-tight">{title}</p>
            <p className="text-sm font-semibold text-orange-300">{peso(price)}</p>
          </div>
          <span className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold">30:00</span>
        </div>
        <div className="px-4 pb-4 pt-3">
          <Link href={href} className="k-btn k-btn-primary w-full text-[15px]">
            <Zap className="h-4 w-4" fill="currentColor" />
            Secure Order via Guma Kart
          </Link>
          <p className="mt-2 text-center text-[11px] text-white/55">Address · GCash / Maya / COD · BayanGo delivery</p>
        </div>
      </div>
    </div>
  );
}
