import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquareHeart } from "lucide-react";
import { ContactForm } from "@/components/landing/contact-form";
import {
  Breadcrumb,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Contact — Guma Commerce",
  description: "Get in touch with the Guma Commerce team for sales, support, and partnerships.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Contact" }]} />
      <PageHeader
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Seller support, partnerships, or press — send a message and we’ll route it to the helpdesk queue."
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-16">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-background p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" aria-hidden />
              General
            </div>
            <a
              href={`mailto:${company.email}`}
              className="mt-2 block text-sm font-medium text-primary hover:underline"
            >
              {company.email}
            </a>
            <p className="mt-1 text-sm text-muted-foreground">
              Sales, partnerships, and general questions
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-background p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquareHeart className="h-4 w-4 text-primary" aria-hidden />
              Seller support
            </div>
            <a
              href={`mailto:${company.support}`}
              className="mt-2 block text-sm font-medium text-primary hover:underline"
            >
              {company.support}
            </a>
            <p className="mt-1 text-sm text-muted-foreground">
              Orders, payments, storefront help — or use the form for a tracked ticket
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-background p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              Location & hours
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{company.address}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              Mon–Fri, 9 AM – 6 PM (PHT)
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-background p-6 shadow-sm shadow-emerald-900/5 sm:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            Send a message
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Creates a helpdesk ticket so our team can reply with a reference number.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
