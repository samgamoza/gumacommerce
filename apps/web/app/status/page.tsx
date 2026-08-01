import type { Metadata } from "next";
import { CheckCircle2, AlertCircle, XCircle, MinusCircle } from "lucide-react";
import { sql } from "drizzle-orm";
import { getDb } from "@guma-commerce/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";

export const metadata: Metadata = {
  title: "System Status — Guma One",
  description: "Real-time status of Guma One platform services.",
};

// Health checks re-run at most every 5 minutes.
export const revalidate = 300;

type ServiceStatus = "operational" | "degraded" | "down" | "not_configured";

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  detail?: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const started = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    const ms = Date.now() - started;
    return {
      name: "Database & storefronts",
      status: ms < 2000 ? "operational" : "degraded",
      detail: `${ms} ms`,
    };
  } catch {
    return { name: "Database & storefronts", status: "down" };
  }
}

async function checkReachable(
  name: string,
  url: string,
  configured: boolean
): Promise<ServiceCheck> {
  if (!configured) {
    return { name, status: "not_configured" };
  }
  try {
    // Any HTTP response (even 401/404) proves the provider is reachable.
    await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000), cache: "no-store" });
    return { name, status: "operational" };
  } catch {
    return { name, status: "down" };
  }
}

async function runChecks(): Promise<ServiceCheck[]> {
  return Promise.all([
    checkDatabase(),
    checkReachable(
      "Payment processing (PayMongo)",
      "https://api.paymongo.com/v1/payment_intents",
      Boolean(process.env.PAYMONGO_SECRET_KEY)
    ),
    checkReachable(
      "Lalamove delivery API",
      process.env.LALAMOVE_ENV === "production"
        ? "https://rest.lalamove.com"
        : "https://rest.sandbox.lalamove.com",
      Boolean(process.env.LALAMOVE_API_KEY)
    ),
    checkReachable(
      "SMS notifications (Semaphore)",
      "https://api.semaphore.co/api/v4/account",
      Boolean(process.env.SEMAPHORE_API_KEY)
    ),
    checkReachable(
      "AI Content Studio",
      "https://generativelanguage.googleapis.com",
      Boolean(
        process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY
      )
    ),
  ]);
}

const STATUS_META: Record<
  ServiceStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  operational: { label: "Operational", className: "text-emerald-600", Icon: CheckCircle2 },
  degraded: { label: "Degraded", className: "text-amber-600", Icon: AlertCircle },
  down: { label: "Down", className: "text-red-600", Icon: XCircle },
  not_configured: { label: "Not configured", className: "text-gray-400", Icon: MinusCircle },
};

export default async function StatusPage() {
  const services = await runChecks();
  const anyDown = services.some((s) => s.status === "down");
  const anyDegraded = services.some((s) => s.status === "degraded");
  const headline = anyDown
    ? "Some systems are down"
    : anyDegraded
      ? "Degraded performance"
      : "All systems operational";
  const checkedAt = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date());

  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "System status" }]} />
      <PageHeader
        eyebrow="Status"
        title={headline}
        description="Live status of Guma One platform services, checked every 5 minutes."
      />

      <ContentSection>
        <div className="mb-6 flex items-center gap-2">
          <Badge variant={anyDown ? "destructive" : "success"} className="gap-1">
            {anyDown ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {headline}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last checked: {checkedAt} (PHT)
          </span>
        </div>

        <div className="space-y-2">
          {services.map((service) => {
            const meta = STATUS_META[service.status];
            return (
              <Card key={service.name} className="border-border/60">
                <CardContent className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${meta.className}`}>
                    <meta.Icon className="h-3.5 w-3.5" />
                    {meta.label}
                    {service.detail ? ` · ${service.detail}` : ""}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-muted/30 p-5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Something not working?</p>
              <p className="mt-1 text-muted-foreground">
                &quot;Not configured&quot; means the integration isn&apos;t enabled in this
                environment. For incidents, email{" "}
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
