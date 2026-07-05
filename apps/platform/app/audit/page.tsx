import {
  Ban,
  CreditCard,
  Flag,
  ScrollText,
  ShieldCheck,
  Store,
  UserCog,
} from "lucide-react";
import { listAuditLog } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { EmptyState, Panel } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

function actionIcon(action: string) {
  if (action.startsWith("tenant_plan") || action.includes("plan"))
    return <CreditCard className="h-4 w-4 text-violet-600" />;
  if (action.startsWith("tenant_suspend") || action.includes("suspend"))
    return <Ban className="h-4 w-4 text-rose-600" />;
  if (action.startsWith("tenant"))
    return <Store className="h-4 w-4 text-emerald-600" />;
  if (action.startsWith("user"))
    return <UserCog className="h-4 w-4 text-sky-600" />;
  if (action.includes("flag"))
    return <Flag className="h-4 w-4 text-rose-600" />;
  if (action.startsWith("content"))
    return <ShieldCheck className="h-4 w-4 text-amber-600" />;
  return <ScrollText className="h-4 w-4 text-muted-foreground" />;
}

export default async function AuditPage() {
  const session = await requireSuperAdmin();
  const entries = await listAuditLog(200);

  return (
    <PlatformShell
      title="Audit log"
      subtitle="Every administrative action, most recent first"
      user={{ displayName: session.displayName, email: session.email }}
    >
      {entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-5 w-5" />}
          title="No actions logged yet"
          hint="Tenant, user, subscription, and moderation changes will appear here."
        />
      ) : (
        <Panel className="!p-0">
          <ul className="divide-y divide-border">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {actionIcon(entry.action)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold capitalize">
                      {entry.action.replace(/_/g, " ")}
                    </span>
                    {entry.entityLabel && (
                      <span className="text-muted-foreground"> · {entry.entityLabel}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actorEmail ?? "system"} · {formatDateTime(entry.createdAt)}
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <span className="ml-1">
                        ·{" "}
                        {Object.entries(entry.metadata)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(", ")}
                      </span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {entry.entityType}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </PlatformShell>
  );
}
