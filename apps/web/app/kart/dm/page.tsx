import { DmCard } from "@/components/kart/dm-card";
import { PRODUCT, SELLER } from "@/lib/kart/demo";

export const metadata = { title: "DM preview · Guma Kart" };

/* A Messenger-like thread showing the bot's reply after a "MINE" comment (spec §B). */
export default function DmPage() {
  return (
    <main className="mx-auto max-w-md px-3 py-6">
      <div className="k-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[color:var(--kart-line)] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-sm font-bold text-white">TB</span>
          <div className="leading-tight">
            <p className="text-sm font-bold">{SELLER.name}</p>
            <p className="text-xs text-[color:var(--kart-muted)]">Typically replies instantly · Guma Kart bot</p>
          </div>
        </div>
        <div className="grid gap-3 bg-white p-4">
          <p className="text-center text-[11px] text-[color:var(--kart-muted)]">Today 8:41 PM · from your comment on the live</p>
          <p className="text-right">
            <span className="inline-block max-w-[75%] rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2 text-[15px] text-white">MINE</span>
          </p>
          <DmCard buyer="Marites" title={PRODUCT.title} price={PRODUCT.price} />
          <p className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-[15px] leading-snug text-slate-900">
            Slots left: {PRODUCT.stock}. Delivery by BayanGo — same day in Metro Manila. 🛵
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-[color:var(--kart-muted)]">Tap the orange button to open the checkout webview.</p>
    </main>
  );
}
