import {
  Bot,
  Copy,
  Link2,
  MapPin,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

function FeatureHead({
  icon: Icon,
  color,
  title,
  desc,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

export function LandingFeatures() {
  const analyticsBars = [42, 68, 55, 84, 72, 100, 91];

  return (
    <section id="features" className="border-y border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a social seller needs to{" "}
            <span className="text-gradient">look like a real brand</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Compete with big shops without hiring a developer, designer, or logistics team.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {/* AI Content Studio — large */}
          <BentoCard className="lg:col-span-3">
            <FeatureHead
              icon={Bot}
              color="bg-emerald-500/10 text-emerald-600"
              title="AI Content Studio"
              desc="Viral TikTok scripts, carousel captions, product listings, and 7-day campaigns — written in Taglish, with your Order Now link already inside."
            />
            <div className="mt-5 rounded-2xl border border-border/60 bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <Sparkles className="h-3 w-3" /> TikTok caption · generated
                </span>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-foreground">
                POV: hindi mo na kailangan mag-abroad para sa negosyo 🥭✨ Ang creamy ng Mango
                Graham Shake namin — ₱119 lang! Order na sa link sa bio, libre delivery today
                only! 🛵
              </p>
              <p className="mt-2 text-[10px] font-medium text-primary">
                #MangoGraham #SupportLocalPH #TikTokFindsPH · guma.ph/haloqueen
              </p>
            </div>
          </BentoCard>

          {/* PH payments — large */}
          <BentoCard className="lg:col-span-3">
            <FeatureHead
              icon={Zap}
              color="bg-blue-500/10 text-blue-600"
              title="PH-native payments"
              desc="GCash, Maya, QRPh, cards, and COD — auto-verified, no more screenshot proofs. Built for how Filipinos actually pay online."
            />
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                {["GCash", "Maya", "QRPh", "Visa / MC", "COD"].map((m) => (
                  <span
                    key={m}
                    className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-emerald-700">Payment received</p>
                  <p className="text-[10px] text-muted-foreground">Order #1042 · GCash</p>
                </div>
                <p className="font-display text-lg font-bold text-emerald-700">₱1,247</p>
              </div>
            </div>
          </BentoCard>

          {/* Order Now link */}
          <BentoCard className="lg:col-span-2">
            <FeatureHead
              icon={Link2}
              color="bg-violet-500/10 text-violet-600"
              title="One link, every post"
              desc="FB, IG, TikTok, reels, stories, and bio — customers tap and order. No PMs."
            />
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate text-xs font-semibold text-primary">
                guma.ph/your-shop
              </span>
            </div>
          </BentoCard>

          {/* Lalamove */}
          <BentoCard className="lg:col-span-2">
            <FeatureHead
              icon={Truck}
              color="bg-orange-500/10 text-orange-600"
              title="Lalamove built-in"
              desc="Auto-quoted fees, one-tap rider booking, live tracking shared with your buyer."
            />
            <div className="mt-4 rounded-xl border border-border/60 bg-background p-3">
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-orange-600">
                  <MapPin className="h-3 w-3" /> Picked up
                </span>
                <span className="text-muted-foreground">ETA 12 min</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
              </div>
            </div>
          </BentoCard>

          {/* Analytics */}
          <BentoCard className="lg:col-span-2">
            <FeatureHead
              icon={TrendingUp}
              color="bg-amber-500/10 text-amber-600"
              title="Sales analytics"
              desc="Top products, peak hours, and which channel actually converts."
            />
            <div className="mt-4 flex h-16 items-end gap-1.5">
              {analyticsBars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 origin-bottom animate-grow-bar rounded-t-md ${
                    i === analyticsBars.length - 2
                      ? "bg-gradient-to-t from-emerald-600 to-teal-400"
                      : "bg-primary/20"
                  }`}
                />
              ))}
            </div>
          </BentoCard>

          {/* Mobile-first — full width strip */}
          <BentoCard className="md:col-span-2 lg:col-span-6">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <FeatureHead
                icon={Smartphone}
                color="bg-pink-500/10 text-pink-600"
                title="Mobile-first, prepaid-data friendly"
                desc="PWA-ready storefront that loads fast on 4G prepaid. Guest checkout in under 60 seconds — no app installs, no signups for buyers."
              />
              <div className="flex shrink-0 gap-6 sm:gap-8">
                {[
                  { v: "<1s", l: "First load" },
                  { v: "60s", l: "Checkout" },
                  { v: "0", l: "App installs" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <p className="font-display text-2xl font-bold text-primary">{s.v}</p>
                    <p className="text-[11px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Zap,
      title: "Create your shop",
      desc: "Sign up, add products manually or with AI, get your branded link and QR code.",
      chip: "≈ 5 minutes",
    },
    {
      step: "02",
      icon: Bot,
      title: "Post with AI content",
      desc: "Generate captions and TikTok scripts with your Order Now link already embedded.",
      chip: "1 tap to copy",
    },
    {
      step: "03",
      icon: TrendingUp,
      title: "Get paid & deliver",
      desc: "Customers check out via GCash or Maya. Book Lalamove in one click. Track everything.",
      chip: "While you sleep",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From social post to delivered order in 3 steps
          </h2>
        </div>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-amber-500/50 md:block" />
          {steps.map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 font-display text-xl font-bold text-white shadow-lg shadow-primary/25 ring-4 ring-background">
                {item.step}
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
              <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {item.chip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingSocialProof() {
  const quotes = [
    {
      name: "Maria S.",
      initials: "MS",
      gradient: "from-emerald-500 to-teal-600",
      role: "Halo-halo seller, Quezon City",
      channel: "Facebook",
      quote:
        "Dati sa Messenger lang — ang daming tanong, walang bayad. Ngayon may link na ako sa bawat post. 3x orders in 2 weeks.",
      stat: "3× orders",
    },
    {
      name: "Juan D.",
      initials: "JD",
      gradient: "from-amber-500 to-orange-600",
      role: "Streetwear reseller, BGC",
      channel: "TikTok",
      quote:
        "Yung AI captions ang game-changer. Hindi na ako nagiisip ng Taglish copy every day. GCash checkout lang, tapos.",
      stat: "Daily posts, zero effort",
    },
    {
      name: "Anna L.",
      initials: "AL",
      gradient: "from-pink-500 to-rose-600",
      role: "Skincare brand, Cebu",
      channel: "Instagram",
      quote:
        "Professional na tingnan ng shop ko. Customers trust us more — may receipt, may tracking, hindi na chat lang.",
      stat: "+40% repeat buyers",
    },
  ];

  return (
    <section className="border-y border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Seller stories
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From side-hustle to <span className="text-gradient">real business</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {quotes.map((t) => (
            <Card
              key={t.name}
              className="border-border/60 bg-card transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  {t.stat}
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-xs font-bold text-white`}
                  >
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.role} · sells on {t.channel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
