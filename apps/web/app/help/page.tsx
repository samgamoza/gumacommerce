import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CreditCard, MessageSquare, Rocket, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";

export const metadata: Metadata = {
  title: "Help Center — Guma One",
  description: "Guides and resources for Guma One sellers and customers.",
};

const topics = [
  {
    icon: Rocket,
    title: "Getting started",
    desc: "Create your shop, add products, and share your first Order Now link.",
    href: "/help/sellers",
  },
  {
    icon: CreditCard,
    title: "Payments & payouts",
    desc: "Connect GCash, Maya, and understand settlement timelines.",
    href: "/faq#payments",
  },
  {
    icon: Truck,
    title: "Delivery & logistics",
    desc: "Lalamove integration, delivery fees, and manual riders.",
    href: "/faq#delivery",
  },
  {
    icon: MessageSquare,
    title: "AI Content Studio",
    desc: "Generate TikTok scripts, captions, and product listings.",
    href: "/faq#ai",
  },
  {
    icon: BookOpen,
    title: "Policies & compliance",
    desc: "Privacy, terms, refunds, and Philippine e-commerce regulations.",
    href: "/privacy",
  },
];

export default function HelpPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Help center" }]} />
      <PageHeader
        eyebrow="Support"
        title="How can we help?"
        description="Browse guides and resources, or visit our FAQ for quick answers."
      />

      <ContentSection>
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link key={topic.title} href={topic.href}>
              <Card className="h-full border-border/60 transition hover:border-primary/30 hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <topic.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{topic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{topic.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-muted/50 p-6 text-center">
          <p className="font-display font-semibold text-foreground">Can&apos;t find what you need?</p>
          <p className="mt-2 text-sm">Check our FAQ or contact support directly.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/faq" className="text-sm font-medium text-primary hover:underline">
              View FAQs →
            </Link>
            <Link href="/contact" className="text-sm font-medium text-primary hover:underline">
              Contact us →
            </Link>
          </div>
        </div>
      </ContentSection>
    </MarketingShell>
  );
}
