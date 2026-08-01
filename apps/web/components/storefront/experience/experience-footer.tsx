"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useStorefrontExperience } from "./storefront-experience-context";

export function ExperienceFooter() {
  const { tenant } = useStorefrontExperience();
  const theme = tenant.shopTheme;

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-foreground p-7 text-center text-background sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" /> Order from any platform
          </span>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Share your {tenant.name} link on Facebook, TikTok & Instagram
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-background/70">
            {theme.promoSubtitle || "One link. Fast checkout. Delivered to your door."}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-lg">{tenant.logoEmoji}</span>
            </span>
            <span className="font-display text-xl font-bold text-foreground">{tenant.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {tenant.tagline}
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Shop</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#featured" className="hover:text-foreground">
                Featured
              </a>
            </li>
            <li>
              <a href="#live" className="hover:text-foreground">
                Live Selling
              </a>
            </li>
            <li>
              <a href="#popular" className="hover:text-foreground">
                Popular
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Powered by</h3>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Guma One
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {tenant.name}
          </p>
          <p>Built with Guma One</p>
        </div>
      </div>
    </footer>
  );
}
