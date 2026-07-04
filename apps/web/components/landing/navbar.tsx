import Link from "next/link";
import { ArrowRight, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminUrl } from "@/lib/utils";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Guma Commerce</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#features" className="transition hover:text-foreground">
            Features
          </Link>
          <Link href="/#how-it-works" className="transition hover:text-foreground">
            How it works
          </Link>
          <Link href="/pricing" className="transition hover:text-foreground">
            Pricing
          </Link>
          <Link href="/faq" className="transition hover:text-foreground">
            FAQ
          </Link>
          <Link href="/about" className="transition hover:text-foreground">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={`${adminUrl}/login`} className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Seller login
            </Button>
          </Link>
          <Link href={`${adminUrl}/signup`}>
            <Button size="sm" className="gap-1.5">
              Start free
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
