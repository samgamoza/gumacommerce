"use client";

import { SettingsPageLayout } from "@/components/settings/settings-shell";
import { SettingsCard } from "@/components/settings/settings-forms";

const SUPPORT_EMAIL = "support@gumacommerce.ph";

export function SupportSettingsPage() {
  return (
    <SettingsPageLayout
      title="Help & support"
      description="Get help with orders, payouts, subscriptions, and your storefront."
    >
      <SettingsCard title="Contact support">
        <p className="text-sm text-muted-foreground">
          Email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-emerald-700 underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          — we typically reply within one business day.
        </p>
      </SettingsCard>

      <SettingsCard title="Common topics">
        <ul className="space-y-2 text-sm text-foreground">
          <li>
            <a href="/settings/subscription" className="font-medium text-emerald-700 hover:underline">
              Subscription & billing
            </a>
          </li>
          <li>
            <a href="/settings/wallet" className="font-medium text-emerald-700 hover:underline">
              Wallet & payout issues
            </a>
          </li>
          <li>
            <a href="/settings/kyc" className="font-medium text-emerald-700 hover:underline">
              KYC verification
            </a>
          </li>
          <li>
            <a href="/settings/account" className="font-medium text-emerald-700 hover:underline">
              Password & account access
            </a>
          </li>
        </ul>
      </SettingsCard>
    </SettingsPageLayout>
  );
}
