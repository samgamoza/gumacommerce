"use client";

import { useState } from "react";
import { SettingsPageLayout } from "@/components/settings/settings-shell";
import { SettingsActions, SettingsCard, SettingsField, inputClassName } from "@/components/settings/settings-forms";

export function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <SettingsPageLayout
      title="Password & security"
      description="Update your login password and keep your seller account secure."
    >
      <SettingsCard title="Change password">
        <SettingsField label="Current password">
          <input
            type="password"
            autoComplete="current-password"
            className={inputClassName()}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </SettingsField>
        <SettingsField label="New password">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClassName()}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </SettingsField>
        <SettingsField label="Confirm new password">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClassName()}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </SettingsField>
        <p className="text-xs text-muted-foreground">
          Password reset via email is coming soon. Contact support if you are locked out.
        </p>
        <SettingsActions onSave={() => undefined} saving={false} saved={false} />
      </SettingsCard>
    </SettingsPageLayout>
  );
}
