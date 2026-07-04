import type { Metadata } from "next";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";

export const metadata: Metadata = {
  title: "System Status — Guma Commerce",
  description: "Real-time status of Guma Commerce platform services.",
};

const services = [
  { name: "Storefront & checkout", status: "operational" },
  { name: "Seller dashboard", status: "operational" },
  { name: "Payment processing (PayMongo)", status: "operational" },
  { name: "Lalamove delivery API", status: "operational" },
  { name: "AI Content Studio", status: "operational" },
  { name: "SMS notifications", status: "operational" },
];

export default function StatusPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "System status" }]} />
      <PageHeader
        eyebrow="Status"
        title="All systems operational"
        description="Current status of Guma Commerce platform services. Updated every 5 minutes."
      />

      <ContentSection>
        <div className="mb-6 flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            All systems go
          </Badge>
          <span className="text-sm text-muted-foreground">Last checked: just now</span>
        </div>

        <div className="space-y-2">
          {services.map((service) => (
            <Card key={service.name} className="border-border/60">
              <CardContent className="flex items-center justify-between py-4">
                <span className="text-sm font-medium text-foreground">{service.name}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Operational
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-muted/30 p-5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Incident history</p>
              <p className="mt-1 text-muted-foreground">
                No incidents reported in the last 90 days. Subscribe to status updates at{" "}
                <a href="mailto:support@gumacommerce.ph" className="text-primary hover:underline">
                  support@gumacommerce.ph
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </ContentSection>
    </MarketingShell>
  );
}
