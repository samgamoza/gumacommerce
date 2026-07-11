import { notFound } from "next/navigation";
import { DASHBOARD_FEATURES } from "@/lib/dashboard-features";
import { DashboardFeatureClient } from "./dashboard-feature-client";

export function generateStaticParams() {
  return Object.keys(DASHBOARD_FEATURES).map((feature) => ({ feature }));
}

export default async function Page({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  if (!DASHBOARD_FEATURES[feature]) notFound();
  return <DashboardFeatureClient featureId={feature} />;
}
