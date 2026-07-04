import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  ContentSection,
  MarketingShell,
  PageHeader,
} from "@/components/landing/marketing-shell";
import { company } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Careers — Guma Commerce",
  description: "Join the team building social commerce for the Philippines.",
};

const openings = [
  {
    title: "Full-stack Engineer",
    team: "Engineering",
    location: "Metro Manila / Remote (PH)",
    type: "Full-time",
  },
  {
    title: "Seller Success Manager",
    team: "Operations",
    location: "Metro Manila",
    type: "Full-time",
  },
  {
    title: "Content & Community Lead",
    team: "Marketing",
    location: "Remote (PH)",
    type: "Full-time",
  },
];

export default function CareersPage() {
  return (
    <MarketingShell>
      <Breadcrumb items={[{ label: "Careers" }]} />
      <PageHeader
        eyebrow="Careers"
        title="Help us empower every Filipino seller"
        description="We're building the infrastructure for Philippine social commerce. Join a mission-driven team."
      />

      <ContentSection>
        <h2>Why Guma Commerce?</h2>
        <ul>
          <li>Work on products used by real home-based businesses across the Philippines</li>
          <li>Remote-friendly with Metro Manila hub</li>
          <li>Competitive salary + equity for early team members</li>
          <li>HMO, government contributions, and flexible hours</li>
        </ul>

        <h2 className="mt-10">Open positions</h2>
        <div className="mt-4 space-y-3">
          {openings.map((job) => (
            <Card key={job.title} className="border-border/60">
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display font-semibold text-foreground">{job.title}</p>
                  <p className="mt-1 text-sm">
                    {job.team} · {job.location} · {job.type}
                  </p>
                </div>
                <a href={`mailto:${company.email}?subject=Application: ${job.title}`}>
                  <Button variant="secondary" size="sm">
                    Apply
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-sm">
          Don&apos;t see a fit? Send your CV to{" "}
          <a href={`mailto:${company.email}`} className="text-primary hover:underline">
            {company.email}
          </a>
          .
        </p>
      </ContentSection>
    </MarketingShell>
  );
}
