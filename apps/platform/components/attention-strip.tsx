import Link from "next/link";
import type { PlatformAttention } from "@guma-commerce/db";

type Item = {
  href: string;
  label: string;
  count: number;
  tone: "rose" | "amber" | "sky" | "violet";
};

export function AttentionStrip({ attention }: { attention: PlatformAttention }) {
  const items: Item[] = (
    [
      {
        href: "/helpdesk",
        label: attention.breachedTickets > 0 ? "SLA breached tickets" : "Open tickets",
        count: attention.breachedTickets > 0 ? attention.breachedTickets : attention.openTickets,
        tone: (attention.breachedTickets > 0 ? "rose" : "amber") as Item["tone"],
      },
      {
        href: "/tenants?status=pending",
        label: "Pending shops",
        count: attention.pendingTenants,
        tone: "amber" as const,
      },
      {
        href: "/tenants?status=suspended",
        label: "Suspended shops",
        count: attention.suspendedTenants,
        tone: "rose" as const,
      },
      {
        href: "/moderation",
        label: attention.moderationFlagged > 0 ? "Flagged content" : "Moderation queue",
        count:
          attention.moderationFlagged > 0
            ? attention.moderationFlagged
            : attention.moderationPending,
        tone: (attention.moderationFlagged > 0 ? "rose" : "sky") as Item["tone"],
      },
      {
        href: "/templates",
        label: "Stock drafts to publish",
        count: attention.stockDrafts,
        tone: "violet" as const,
      },
    ] satisfies Item[]
  ).filter((i) => i.count > 0);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Nothing urgent — no open tickets, pending/suspended shops, moderation backlog, or stock
        drafts.
      </div>
    );
  }

  const tones: Record<Item["tone"], string> = {
    rose: "border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100",
    amber: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
    sky: "border-sky-200 bg-sky-50 text-sky-950 hover:bg-sky-100",
    violet: "border-violet-200 bg-violet-50 text-violet-950 hover:bg-violet-100",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold tracking-tight">Needs attention</h2>
        <p className="text-xs text-muted-foreground">
          Cross-tenant queues — use Support access on a tenant to work inside seller admin.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`rounded-xl border px-3 py-3 transition ${tones[item.tone]}`}
          >
            <p className="font-display text-2xl font-bold tabular-nums">{item.count}</p>
            <p className="mt-0.5 text-xs font-medium">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
