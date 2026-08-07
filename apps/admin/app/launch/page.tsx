import { Suspense } from "react";
import { LaunchWizard } from "@/components/launch-wizard";

export default function LaunchPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading storefront look…</p>}>
      <LaunchWizard />
    </Suspense>
  );
}
