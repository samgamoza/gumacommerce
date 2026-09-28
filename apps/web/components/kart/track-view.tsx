"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle, Phone, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { ORDER_STORAGE_KEY, peso, PRODUCT, SELLER, TRACK_STEPS, type PlacedOrder, type TrackStepKey } from "@/lib/kart/demo";
import { ProductThumb } from "./ui";
import { Tracker } from "./tracker";

const DEMO_ORDER: PlacedOrder = {
  number: "GK-DEMO-4821",
  placedAt: new Date().toISOString(),
  buyer: { name: "Marites Santos", phone: "+639171234567" },
  addressText: "Blk 4 Lot 12, Maligaya St., Brgy. Socorro, Quezon City, Metro Manila",
  method: "gcash",
  totals: { subtotal: PRODUCT.price, shipping: 79, codFee: 0, total: PRODUCT.price + 79 },
  shipping: { amount: 79, eta: "Same day", zone: "metro" },
  product: PRODUCT,
};

const METHOD_LABEL = { gcash: "GCash", maya: "Maya", cod: "Cash on Delivery" } as const;

/* Post-purchase fulfilment screen (spec §D). Stage is demo-driven via the buttons at the bottom. */
export function TrackView() {
  const params = useSearchParams();
  const [order, setOrder] = useState<PlacedOrder>(DEMO_ORDER);
  const [stage, setStage] = useState<TrackStepKey>("locked");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PlacedOrder;
        if (!params.get("order") || saved.number === params.get("order")) setOrder(saved);
      }
    } catch {}
  }, [params]);

  const idx = TRACK_STEPS.findIndex((s) => s.key === stage);
  const arrived = stage === "arrived";

  return (
    <div className="mx-auto w-full max-w-md pb-28">
      <section className="m-3 rounded-2xl p-5 text-white" style={{ background: "var(--kart-ink)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Order {order.number}</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">
          {arrived ? "Delivered. Salamat po!" : idx >= 2 ? "Your parcel is with BayanGo." : "Order locked in."}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {order.method === "cod" ? `Prepare ${peso(order.totals.total)} cash for the rider.` : `${METHOD_LABEL[order.method]} payment confirmed · ${order.shipping.eta}`}
        </p>
      </section>

      <section className="k-card m-3 p-4">
        <Tracker current={stage} />
      </section>

      <section className="k-card m-3 flex items-center gap-3 p-3">
        <ProductThumb size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{order.product.title}</p>
          <p className="text-xs text-[color:var(--kart-muted)]">{order.product.variant}</p>
        </div>
        <p className="text-sm font-extrabold tabular-nums">{peso(order.totals.total)}</p>
      </section>

      <section className="k-card m-3 divide-y divide-[color:var(--kart-line)] text-sm">
        <Line icon={MapPin} label="Deliver to" value={`${order.buyer.name} · ${order.addressText}`} />
        <Line icon={Phone} label="Updates via SMS" value={order.buyer.phone} />
        <Line icon={CreditCard} label="Payment" value={`${METHOD_LABEL[order.method]} · ${peso(order.totals.total)}`} />
      </section>

      {/* Demo controls — remove once wired to BayanGo webhooks */}
      <section className="m-3 rounded-xl border border-dashed border-slate-300 p-3 text-xs text-[color:var(--kart-muted)]">
        <p className="font-semibold text-slate-600">Demo: simulate BayanGo webhook</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TRACK_STEPS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStage(s.key)}
              className={`rounded-full border px-2.5 py-1 font-medium ${stage === s.key ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Retention utility: sticky secondary action */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--kart-line)] bg-white/95 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-md p-3">
          <a href={SELLER.messengerUrl} target="_blank" rel="noopener" className="k-btn k-btn-ghost w-full">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            Chat with {SELLER.name} on Messenger
            <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Line({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--kart-muted)]" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--kart-muted)]">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
