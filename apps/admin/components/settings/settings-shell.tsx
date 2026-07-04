"use client";

import { AdminShell } from "@/components/admin-shell";

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
    <AdminShell title={title}>
      <p className="mb-6 text-sm text-gray-500">{description}</p>
      {children}
    </AdminShell>
  );
}

/** @deprecated use SettingsPageLayout */
export const SettingsShell = SettingsPageLayout;
