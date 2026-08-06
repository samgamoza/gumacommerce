import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/landing/contact-form";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Contact — Guma One",
  description: "Get in touch with the Guma One team for sales, support, and partnerships.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Contact" }]} />
      <PageHeader
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Whether you're a seller ready to launch, a partner, or press — our team is here to help."
      />

      <ContentSection>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-primary" />
                  General inquiries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                  {company.email}
                </a>
                <p className="mt-2 text-sm">Sales, partnerships, and general questions</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4 text-primary" />
                  Seller support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href={`mailto:${company.support}`} className="text-primary hover:underline">
                  {company.support}
                </a>
                <p className="mt-2 text-sm">Help with orders, payments, and your storefront</p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Office
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{company.address}</p>
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Mon–Fri, 9 AM – 6 PM (PHT)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </MarketingShell>
  );
}
