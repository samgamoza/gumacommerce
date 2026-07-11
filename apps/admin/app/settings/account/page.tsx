import { Suspense } from "react";
import { AccountSettingsPage } from "@/components/settings/account-settings";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
      <AccountSettingsPage />
    </Suspense>
  );
}
