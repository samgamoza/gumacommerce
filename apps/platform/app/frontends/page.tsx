import { getActiveLanding } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { Panel, SectionHeader } from "@/components/ui";
import { FrontendSwitcher } from "@/components/frontend-switcher";

export const dynamic = "force-dynamic";

export default async function FrontendsPage() {
  const session = await requireSuperAdmin();
  const active = await getActiveLanding();
  const webUrl =
    process.env.NEXT_PUBLIC_WEB_URL ??
    process.env.NEXT_PUBLIC_STOREFRONT_URL ??
    "http://localhost:3010";

  return (
    <PlatformShell
      title="Frontends"
      subtitle="Choose which marketing landing the public sees"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <Panel>
        <SectionHeader title="Active homepage" />
        <p className="mt-1 text-sm text-muted-foreground">
          Controls what visitors see at the public homepage. Changes apply immediately.
        </p>
        <div className="mt-4">
          <FrontendSwitcher active={active} webUrl={webUrl} />
        </div>
      </Panel>
    </PlatformShell>
  );
}
