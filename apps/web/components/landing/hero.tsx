import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Camera,
  Play,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminUrl } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden hero-glow">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
        <div className="animate-fade-up text-center lg:text-left">
          <Badge variant="social" className="mb-6 gap-1.5 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Built for Philippine social sellers
          </Badge>

          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Turn every post into{" "}
            <span className="text-gradient">paying customers</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            Stop losing sales in Messenger chats. Guma Commerce gives you a branded mobile store,
            AI-powered marketing, GCash checkout, and Lalamove delivery — linked from every FB,
            TikTok, and IG post.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/demo">
              <Button size="xl" className="w-full sm:w-auto">
                Try live demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`${adminUrl}/ai-studio`}>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4" />
                AI Content Studio
              </Button>
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            {["Free to start", "No credit card", "Setup in 5 minutes"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-sm animate-fade-up lg:max-w-none [animation-delay:150ms]">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/20 via-teal-400/10 to-amber-400/20 blur-2xl" />
          <div className="relative mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-foreground/10 bg-foreground p-2 shadow-2xl sm:w-[300px]">
            <div className="overflow-hidden rounded-[2rem] bg-background">
              <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍧</span>
                  <div>
                    <p className="text-sm font-bold">Halo Queen Manila</p>
                    <p className="text-[10px] opacity-80">Order Now · Open</p>
                  </div>
                </div>
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="space-y-3 p-3">
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 p-3 text-white">
                  <p className="text-[10px] font-medium opacity-90">Summer promo</p>
                  <p className="text-sm font-bold">Free delivery ₱500+</p>
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-2 rounded-xl border border-border/60 p-2">
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-xs font-semibold">Premium Halo-Halo</p>
                      <p className="text-sm font-bold text-primary">₱149</p>
                    </div>
                  </div>
                ))}
                <div className="rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground">
                  Checkout · GCash / Maya
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -left-4 top-1/4 hidden animate-float rounded-2xl border border-border/60 bg-card p-3 shadow-lg sm:block">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
                <Camera className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs font-semibold">New order!</p>
                <p className="text-[10px] text-muted-foreground">From Instagram reel</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 bottom-1/4 hidden animate-float rounded-2xl border border-border/60 bg-card p-3 shadow-lg sm:block [animation-delay:1s]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Play className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold">+₱2,487 today</p>
                <p className="text-[10px] text-muted-foreground">12 orders via TikTok</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
