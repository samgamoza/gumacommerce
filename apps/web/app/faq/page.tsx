import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { faqCategories } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "FAQs — Guma One",
  description: "Frequently asked questions about Guma One social commerce for Philippine sellers.",
};

export default function FaqPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "FAQs" }]} />
      <PageHeader
        eyebrow="Support"
        title="Frequently asked questions"
        description="Payments, delivery, plans, and compliance — answered for how Guma Commerce actually works in soft launch."
      />

      <ContentSection>
        <div className="space-y-10">
          {faqCategories.map((category) => (
            <div key={category.title} id={category.id}>
              <h2>{category.title}</h2>
              <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border/60 bg-card px-4">
                {category.items.map((item, i) => (
                  <AccordionItem key={item.q} value={`${category.title}-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:text-left">
            <MessageCircle className="h-10 w-10 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="font-display font-semibold text-foreground">Still have questions?</p>
              <p className="mt-1 text-sm">
                Our team responds within 24 hours on business days.
              </p>
            </div>
            <Link href="/contact">
              <Button>Contact support</Button>
            </Link>
          </CardContent>
        </Card>
      </ContentSection>
    </MarketingShell>
  );
}
