import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupportTicketById } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { HelpdeskTicketActions } from "@/components/helpdesk-ticket-actions";
import { Panel, StatusPill } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HelpdeskTicketPage({ params }: PageProps) {
  const session = await requireSuperAdmin();
  const { id } = await params;
  const ticket = await getSupportTicketById(id, { includeInternal: true });
  if (!ticket) notFound();

  return (
    <PlatformShell
      title={ticket.ticketNumber}
      subtitle={ticket.subject}
      user={{ displayName: session.displayName, email: session.email }}
    >
      <Link
        href="/helpdesk"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to helpdesk
      </Link>

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusPill status={ticket.status} />
        <StatusPill status={ticket.priority} />
        <StatusPill status={ticket.category} />
        <StatusPill status={ticket.channel} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel className="space-y-4">
          <div className="space-y-3">
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  m.isInternal
                    ? "border-amber-200 bg-amber-50/80"
                    : m.authorType === "agent"
                      ? "border-primary/20 bg-primary/5"
                      : "border-border bg-muted/30"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {m.authorName ?? m.authorType}
                  </span>
                  <span>{m.authorType}</span>
                  {m.isInternal && (
                    <span className="rounded bg-amber-200/80 px-1.5 py-0.5 font-medium text-amber-900">
                      internal
                    </span>
                  )}
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
          <HelpdeskTicketActions
            ticketId={ticket.id}
            status={ticket.status}
            priority={ticket.priority}
          />
        </Panel>

        <Panel className="h-fit space-y-3 text-sm">
          <h3 className="font-semibold">Requester</h3>
          <p>{ticket.requesterName ?? "—"}</p>
          <p className="text-muted-foreground">{ticket.requesterEmail ?? "No email"}</p>
          <p className="text-muted-foreground">{ticket.requesterPhone ?? "No phone"}</p>
          <hr className="border-border" />
          <p>
            <span className="text-muted-foreground">Shop: </span>
            {ticket.tenantName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Assignee: </span>
            {ticket.assigneeName ?? "Unassigned"}
          </p>
          <p>
            <span className="text-muted-foreground">Created: </span>
            {formatDateTime(ticket.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">First response SLA: </span>
            {ticket.slaFirstResponseDueAt
              ? formatDateTime(ticket.slaFirstResponseDueAt)
              : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Resolve SLA: </span>
            {ticket.slaResolveDueAt ? formatDateTime(ticket.slaResolveDueAt) : "—"}
          </p>
        </Panel>
      </div>
    </PlatformShell>
  );
}
