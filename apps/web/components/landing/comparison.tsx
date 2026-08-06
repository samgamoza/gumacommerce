import { ArrowDown, BadgeCheck, Check, MessageCircle, X } from "lucide-react";

const painPoints = [
  "Buyers ask “HM po?” then disappear",
  "Orders buried under 200 unread chats",
  "Manual GCash screenshots to verify",
  "No receipts, no tracking, no trust",
];

const wins = [
  "Prices, stock & variants on every product",
  "Orders land in one dashboard, not your inbox",
  "GCash / Maya instructions + seller confirm (or COD)",
  "Book courier or assign rider when you're ready",
];

function ChatBubble({
  from,
  children,
  seller,
}: {
  from: string;
  children: React.ReactNode;
  seller?: boolean;
}) {
  return (
    <div className={`flex ${seller ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-snug ${
          seller
            ? "rounded-br-sm bg-blue-500 text-white"
            : "rounded-bl-sm bg-muted text-foreground"
        }`}
      >
        {!seller && <p className="mb-0.5 text-[9px] font-bold text-muted-foreground">{from}</p>}
        {children}
      </div>
    </div>
  );
}

export function LandingComparison() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            The problem
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Selling in chats is where{" "}
            <span className="text-gradient-amber">sales go to die</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every &ldquo;check DM po&rdquo; is a customer you make wait — and most never come back.
            Here&apos;s the difference a real storefront makes.
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 lg:grid-cols-2">
          {/* Before: Messenger chaos */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <MessageCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">The Messenger method</p>
                <p className="text-xs text-muted-foreground">How most sellers lose money today</p>
              </div>
            </div>

            <div className="mt-6 space-y-2 rounded-2xl border border-border/60 bg-background p-4">
              <ChatBubble from="Buyer 1">HM po? 👀</ChatBubble>
              <ChatBubble from="Buyer 2">Avail pa ba yung mango?</ChatBubble>
              <ChatBubble from="You" seller>
                Hi po! ₱119 po, avail pa 😊
              </ChatBubble>
              <ChatBubble from="Buyer 2">Sige, GCash ko mamaya</ChatBubble>
              <div className="pt-1 text-center text-[10px] font-medium text-red-500">
                Seen · 3 days ago · never paid
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {painPoints.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow between cards */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <div className="flex h-12 w-12 -rotate-90 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
              <ArrowDown className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div className="mx-auto -my-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 lg:hidden">
            <ArrowDown className="h-4 w-4 text-primary-foreground" />
          </div>

          {/* After: Guma */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card p-6 shadow-xl shadow-primary/10 ring-1 ring-primary/15 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BadgeCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">The Guma way</p>
                <p className="text-xs text-muted-foreground">Same followers, real business</p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 rounded-2xl border border-border/60 bg-background p-4">
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-amber-50 text-lg">
                    🥭
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Mango Graham Shake ×2</p>
                    <p className="text-[10px] text-muted-foreground">Order #1043 · Kia M.</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">₱238</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Paid via GCash
                </span>
                <span className="text-[10px] font-medium text-emerald-700/80">
                  auto-verified · 6:42 PM
                </span>
              </div>
              <div className="pt-1 text-center text-[10px] font-medium text-primary">
                Zero chats needed. You were asleep. 😴
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {wins.map((w) => (
                <li key={w} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
