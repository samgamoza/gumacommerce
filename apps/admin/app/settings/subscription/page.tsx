import { Suspense } from "react";
import { SubscriptionSettingsPage } from "@/components/settings/subscription-settings";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading subscription…</p>}>
      <SubscriptionSettingsPage />
    </Suspense>
  );
}
