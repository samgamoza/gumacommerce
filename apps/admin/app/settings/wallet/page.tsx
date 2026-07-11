import { Suspense } from "react";
import { WalletSettingsPage } from "@/components/settings/wallet-settings";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading wallet…</p>}>
      <WalletSettingsPage />
    </Suspense>
  );
}
