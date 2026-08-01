import type { Metadata } from "next";
import { Heart, Rocket, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "About Us — Guma One",
  description: "Our mission to empower Philippine social sellers with professional e-commerce tools.",
};

const values = [
  {
    icon: Heart,
    title: "Built for Filipinos",
    desc: "GCash, Maya, Taglish AI, Lalamove, and workflows designed for how Filipinos actually buy and sell online.",
  },
  {
    icon: Rocket,
    title: "Seller-first",
    desc: "Every feature exists to help small sellers compete with big brands — without big budgets.",
  },
  {
    icon: Shield,
    title: "Trust & compliance",
    desc: "DPA-compliant, licensed payment partners, transparent pricing, and secure customer data handling.",
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
        description="Guma One was built to solve one problem: talented sellers losing sales in messy Messenger chats. We give them the tools of a real brand — in minutes, not months."
      />

      <ContentSection>
        <h2>Our story</h2>
        <p>
          Millions of Filipinos discover products on Facebook, Instagram, and TikTok every day. But
          the buying experience hasn&apos;t kept up — customers send &ldquo;PM is price&rdquo;
          messages, sellers juggle chats manually, and orders get lost.
        </p>
        <p>
          {company.product} bridges that gap. One Order Now link turns any post into a professional
          mobile storefront with checkout, payments, and delivery — while our AI studio handles the
          marketing copy so sellers can focus on their craft.
        </p>

        <h2 className="mt-10">Our values</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <Card key={v.title} className="border-border/60">
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mt-10">Company information</h2>
        <ul>
          <li>
            <strong className="text-foreground">Legal name:</strong> {company.name}
          </li>
          <li>
            <strong className="text-foreground">Headquarters:</strong> {company.address}
          </li>
          <li>
            <strong className="text-foreground">Contact:</strong> {company.email}
          </li>
          <li>
            <strong className="text-foreground">Registration:</strong> {company.registry}
          </li>
        </ul>
      </ContentSection>
    </MarketingShell>
  );
}
