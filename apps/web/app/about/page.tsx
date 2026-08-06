import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Rocket, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";
import { adminUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us — Guma Commerce",
  description:
    "Why we built Guma Commerce for Philippine social sellers — branded storefronts, honest checkout, and seller-first tools.",
};

const values = [
  {
    icon: Heart,
    title: "Built for Filipinos",
    desc: "GCash, Maya, COD, Taglish-friendly tools, and courier options that match how sellers already ship — Lalamove/Grab when keyed, or assign your own rider.",
  },
  {
    icon: Rocket,
    title: "Seller-first",
    desc: "Launch a real shop link fast. Manual listing first, AI only when it helps — not a wall of features before your first order.",
  },
  {
    icon: Shield,
    title: "Trust & clarity",
    desc: "We design for DPA and Internet Transactions Act expectations, and we don’t market auto-dispatch or instant PayMongo settle unless it’s actually enabled.",
  },
  {
    icon: Users,
    title: "Community powered",
    desc: "From home bakers to fashion resellers — we grow when our sellers grow.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "About us" }]} />
      <PageHeader
        eyebrow="Company"
        title="Empowering every Filipino social seller"
        description="Guma Commerce exists so talented sellers stop losing sales in messy chat threads. One branded storefront. Guest checkout. Tools that match how you actually sell today."
      />

      <ContentSection>
        <h2>Our story</h2>
        <p>
          Millions of Filipinos discover products on Facebook, Instagram, and TikTok every day. The
          buying experience hasn&apos;t kept up — customers send &ldquo;HM po?&rdquo; messages,
          sellers juggle chats manually, and orders get buried.
        </p>
        <p>
          {company.product} bridges that gap. Your Order Now link opens a professional mobile
          storefront with guest checkout (GCash / Maya instructions you confirm, or COD). When
          you&apos;re ready to ship, book a courier or assign a rider from the order screen —
          without pretending the whole country already runs on auto-dispatch.
        </p>

        <h2 className="!mt-12">What we stand for</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-background p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <v.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 !text-base">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="!mt-12">Company information</h2>
        <dl className="mt-4 grid gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Legal name
            </dt>
            <dd className="mt-1 font-medium text-foreground">{company.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Headquarters
            </dt>
            <dd className="mt-1 font-medium text-foreground">{company.address}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contact
            </dt>
            <dd className="mt-1">
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Registration
            </dt>
            <dd className="mt-1 text-foreground">{company.registry}</dd>
          </div>
        </dl>

        <div className="mt-12 flex flex-col items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-foreground">Ready to launch?</p>
            <p className="mt-1 text-sm">
              Start on Free — no credit card. Or{" "}
              <Link href="/contact">talk to us</Link> if you need help.
            </p>
          </div>
          <Link href={`${adminUrl}/signup`}>
            <Button className="gap-1.5">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </ContentSection>
    </MarketingShell>
  );
}
