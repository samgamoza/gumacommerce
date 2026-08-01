"use client";

import { PatternAdminShell } from "@/components/pattern-admin-shell";

export function SettingsPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <PatternAdminShell title={title}>
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      {children}
    </PatternAdminShell>
  );
}

/** @deprecated use SettingsPageLayout */
export const SettingsShell = SettingsPageLayout;
