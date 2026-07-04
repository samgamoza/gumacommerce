import {
  Bot,
  CreditCard,
  Link2,
  Smartphone,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Link2,
    title: "Order Now on every post",
    description:
      "One link for FB, IG, TikTok, reels, stories, and bio. Customers tap and order — no Messenger PMs.",
    color: "text-violet-600 bg-violet-500/10",
  },
  {
    icon: Bot,
    title: "AI Content Studio",
    description:
      "Generate viral TikTok scripts, carousel captions, product listings, and 7-day campaigns in Taglish.",
    color: "text-emerald-600 bg-emerald-500/10",
  },
  {
    icon: CreditCard,
    title: "PH-native payments",
    description: "GCash, Maya, QRPh, cards, and COD. Built for how Filipinos actually pay online.",
    color: "text-blue-600 bg-blue-500/10",
  },
  {
    icon: Truck,
    title: "Lalamove built-in",
    description: "Auto-quote delivery fees, book riders, and share live tracking with buyers and sellers.",
    color: "text-orange-600 bg-orange-500/10",
  },
  {
    icon: Smartphone,
    title: "Mobile-first storefront",
    description: "PWA-ready shop that loads fast on prepaid data. Guest checkout in under 60 seconds.",
    color: "text-pink-600 bg-pink-500/10",
  },
  {
    icon: TrendingUp,
    title: "Sales analytics",
    description: "Track orders, top products, peak hours, and which social channel converts best.",
    color: "text-amber-600 bg-amber-500/10",
  },
];

export function LandingFeatures() {
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

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/60 bg-card/80 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div
                  className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {["GCash", "Maya", "QRPh", "Lalamove", "Facebook", "Instagram", "TikTok"].map(
            (name) => (
              <span
                key={name}
                className="rounded-full border border-border/60 bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {name}
              </span>
            )
          )}
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
    },
    {
      step: "02",
      icon: Bot,
      title: "Post with AI content",
      desc: "Generate captions and TikTok scripts with your Order Now link already embedded.",
    },
    {
      step: "03",
      icon: TrendingUp,
      title: "Get paid & deliver",
      desc: "Customers checkout via GCash/Maya. Book Lalamove in one click. Track everything.",
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

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((item, i) => (
            <div key={item.step} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-border md:block" />
              )}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                {item.step}
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
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
      role: "Halo-halo seller, Quezon City",
      quote:
        "Dati sa Messenger lang — ang daming tanong, walang bayad. Ngayon may link na ako sa bawat post. 3x orders in 2 weeks.",
    },
    {
      name: "Juan D.",
      role: "Streetwear reseller, BGC",
      quote:
        "Yung AI captions ang game-changer. Hindi na ako nagiisip ng Taglish copy every day. GCash checkout lang, tapos.",
    },
    {
      name: "Anna L.",
      role: "Skincare brand, Cebu",
      quote:
        "Professional na tingnan ng shop ko. Customers trust us more — may receipt, may tracking, hindi na chat lang.",
    },
  ];

  return (
    <section className="border-y border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {quotes.map((t) => (
            <Card key={t.name} className="border-border/60 bg-card">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-border/60 pt-4">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
