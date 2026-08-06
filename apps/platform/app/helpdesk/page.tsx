import Link from "next/link";
import { AlertTriangle, Headphones } from "lucide-react";
import { getSupportTicketCounts, listSupportTickets } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { FilterBar } from "@/components/filter-bar";
import { EmptyState, Panel, StatCard, StatusPill } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

interface PageProps {
  searchParams: Promise<{ status?: string; priority?: string; channel?: string; search?: string }>;
}

function slaTone(ticket: {
  status: string;
  firstResponseAt: Date | null;
  slaFirstResponseDueAt: Date | null;
  slaResolveDueAt: Date | null;
}): "ok" | "warn" | "breach" {
  if (ticket.status === "resolved" || ticket.status === "closed") return "ok";
  const now = Date.now();
  if (
    (!ticket.firstResponseAt &&
      ticket.slaFirstResponseDueAt &&
      ticket.slaFirstResponseDueAt.getTime() < now) ||
    (ticket.slaResolveDueAt && ticket.slaResolveDueAt.getTime() < now)
  ) {
    return "breach";
  }
  if (
    ticket.slaFirstResponseDueAt &&
    ticket.slaFirstResponseDueAt.getTime() - now < 60 * 60 * 1000
  ) {
    return "warn";
  }
  return "ok";
}

export default async function HelpdeskPage({ searchParams }: PageProps) {
  const session = await requireSuperAdmin();
  const filters = await searchParams;
  const [counts, items] = await Promise.all([
    getSupportTicketCounts(),
    listSupportTickets({
      status: filters.status,
      priority: filters.priority,
      channel: filters.channel,
      search: filters.search,
    }),
  ]);

  return (
    <PlatformShell
      title="Helpdesk"
      subtitle="Seller & public support tickets with SLA clocks"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open" value={counts.open} tone="amber" />
        <StatCard label="In progress" value={counts.inProgress} tone="violet" />
        <StatCard label="Pending reply" value={counts.pending} tone="violet" />
        <StatCard
          label="SLA breached"
          value={counts.breached}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="rose"
        />
      </div>

      <FilterBar
        basePath="/helpdesk"
        searchPlaceholder="Search ticket #, subject, email…"
        selects={[
          {
            name: "status",
            label: "All statuses",
            options: [
              { value: "open", label: "Open" },
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In progress" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ],
          },
          {
            name: "priority",
            label: "All priorities",
            options: [
              { value: "urgent", label: "Urgent" },
              { value: "high", label: "High" },
              { value: "normal", label: "Normal" },
              { value: "low", label: "Low" },
            ],
          },
          {
            name: "channel",
            label: "All channels",
            options: [
              { value: "web_contact", label: "Web contact" },
              { value: "seller_admin", label: "Seller admin" },
              { value: "buyer_order", label: "Buyer order" },
              { value: "internal", label: "Internal" },
            ],
          },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Headphones className="h-5 w-5" />}
          title="No tickets yet"
          hint="New tickets arrive from the public contact form and seller Help & support."
        />
      ) : (
        <Panel className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {items.map((ticket) => {
              const sla = slaTone(ticket);
              return (
                <li key={ticket.id}>
                  <Link
                    href={`/helpdesk/${ticket.id}`}
                    className="flex flex-col gap-2 px-4 py-3 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ticket.ticketNumber}
                        </span>
                        <StatusPill status={ticket.status} />
                        <StatusPill status={ticket.priority} />
                        {sla === "breach" && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-700">
                            SLA breach
                          </span>
                        )}
                        {sla === "warn" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                            SLA soon
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate font-medium">{ticket.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ticket.requesterName ?? "Anonymous"}
                        {ticket.requesterEmail ? ` · ${ticket.requesterEmail}` : ""}
                        {ticket.tenantName ? ` · ${ticket.tenantName}` : ""}
                        {" · "}
                        {ticket.channel.replace("_", " ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground sm:text-right">
                      <p>{formatDateTime(ticket.createdAt)}</p>
                      <p>{ticket.assigneeName ? `Assigned: ${ticket.assigneeName}` : "Unassigned"}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </PlatformShell>
  );
}
