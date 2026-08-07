import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  CheckCircle2,
  Play,
  ShoppingBag,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminUrl } from "@/lib/utils";

const avatarSeeds = [
  { initials: "MS", from: "from-emerald-500", to: "to-teal-600" },
  { initials: "JD", from: "from-amber-500", to: "to-orange-600" },
  { initials: "AL", from: "from-pink-500", to: "to-rose-600" },
  { initials: "RC", from: "from-violet-500", to: "to-purple-600" },
  { initials: "KB", from: "from-sky-500", to: "to-blue-600" },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[290px] rounded-[2.75rem] border-[6px] border-foreground/10 bg-foreground p-2 shadow-2xl sm:w-[310px]">
      <div className="overflow-hidden rounded-[2.25rem] bg-background">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-primary px-4 pb-3 pt-2 text-primary-foreground">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-base">
              🍧
            </span>
            <div>
              <p className="flex items-center gap-1 text-sm font-bold">
                Halo Queen Manila
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-200" />
              </p>
              <p className="text-[10px] opacity-80">haloqueen.guma.ph · Open now</p>
            </div>
          </div>
          <ShoppingBag className="h-4 w-4" />
        </div>

        <div className="space-y-2.5 p-3">
          {/* Promo banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 p-3 text-white">
            <div className="absolute -right-3 -top-3 h-14 w-14 rounded-full bg-white/10" />
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-90">
              Summer promo
            </p>
            <p className="text-sm font-bold">Free delivery on ₱500+</p>
          </div>

          {/* Products */}
          {[
            { emoji: "🍧", name: "Premium Halo-Halo", price: "₱149", tag: "Bestseller" },
            { emoji: "🥭", name: "Mango Graham Shake", price: "₱119", tag: "New" },
          ].map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card p-2"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-amber-50 text-2xl">
                {p.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <span className="rounded-full bg-amber-500/10 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-amber-600">
                  {p.tag}
                </span>
                <p className="truncate text-xs font-semibold">{p.name}</p>
                <p className="text-sm font-bold text-primary">{p.price}</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                +
              </span>
            </div>
          ))}

          {/* Checkout */}
          <div className="rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground shadow-md shadow-primary/25">
            Checkout · GCash / Maya / COD
          </div>
          <p className="pb-1 text-center text-[9px] text-muted-foreground">
            Guest checkout · No app install · ~60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden hero-glow">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        <div className="animate-fade-up text-center lg:text-left">
          <Badge variant="social" className="mb-6 gap-1.5 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Built for Philippine social sellers
          </Badge>

          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4rem]">
            Stop selling in{" "}
            <span className="relative inline-block">
              <span className="relative z-10">chats.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 rounded-sm bg-amber-300/60 sm:h-4"
              />
            </span>
            <br />
            Start selling in{" "}
            <span className="text-gradient">one tap.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            Guma turns your FB, TikTok, and IG posts into a branded mobile store with
            AI-generated content, GCash &amp; Maya checkout, and Lalamove delivery — no more
            &ldquo;HM po?&rdquo; PMs, no more lost sales.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/model">
              <Button size="xl" className="w-full sm:w-auto">
                Try live demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`${adminUrl}/signup`}>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4" />
                Start free
              </Button>
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            {["Free to start", "No credit card", "Live in 5 minutes"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <div className="flex -space-x-2.5">
              {avatarSeeds.map((a) => (
                <span
                  key={a.initials}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br ${a.from} ${a.to} text-[10px] font-bold text-white`}
                >
                  {a.initials}
                </span>
              ))}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center gap-0.5 sm:justify-start">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Trusted by <span className="font-semibold text-foreground">2,000+</span>{" "}
                sellers from Aparri to Zamboanga
              </p>
            </div>
          </div>
        </div>

        {/* Phone + floating proof cards */}
        <div className="relative mx-auto w-full max-w-sm animate-fade-up pb-6 pt-4 lg:max-w-none [animation-delay:150ms]">
          <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-emerald-400/25 via-teal-400/10 to-amber-400/25 blur-2xl" />
          <PhoneMockup />

          <div className="absolute -left-6 top-[18%] hidden animate-float rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur sm:block">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                <Wallet className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-bold">₱1,247 received</p>
                <p className="text-[10px] text-muted-foreground">GCash · Order #1042</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-[42%] hidden animate-float rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur sm:block [animation-delay:1s]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <Play className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold">+₱8,540 today</p>
                <p className="text-[10px] text-muted-foreground">32 orders via TikTok</p>
              </div>
            </div>
          </div>

          <div className="absolute -left-2 bottom-[10%] hidden animate-float rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur sm:block [animation-delay:2s]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                <Bike className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-bold">Rider on the way</p>
                <p className="text-[10px] text-muted-foreground">Lalamove · 12 min ETA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingMarquee() {
  const items = [
    "GCash",
    "Maya",
    "QRPh",
    "Cards",
    "COD",
    "Lalamove",
    "Facebook",
    "Instagram",
    "TikTok",
    "Messenger",
    "SMS",
  ];
  const row = [...items, ...items];
  return (
    <div className="border-y border-border/60 bg-muted/30 py-5">
      <div className="marquee-mask overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-3 pr-3">
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              {name}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
        Works with the platforms your customers already use
      </p>
    </div>
  );
}
