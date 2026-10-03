import { MessageSquare } from "lucide-react";
import { listOptOuts, listRecentMessages } from "@gumakart/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { EmptyState, Panel, SectionHeader, StatusPill } from "@/components/ui";
import { AddOptOutForm, RemoveOptOutButton } from "@/components/opt-out-controls";
import { formatDateTime } from "@/lib/format";

function mask(phone: string): string {
  return phone.length >= 7 ? `${phone.slice(0, 4)}•••${phone.slice(-3)}` : phone;
}

interface PageProps {
  searchParams: Promise<{ failed?: string }>;
}

/**
 * SMS ops: what we sent (message_log) and who asked to stop. Buyers opt out
 * themselves from the link in reminder texts; support adds the rest here.
 */
export default async function MessagingPage({ searchParams }: PageProps) {
  const session = await requireSuperAdmin();
  const { failed } = await searchParams;
  const failedOnly = failed === "1";
  const [messages, optOuts] = await Promise.all([
    listRecentMessages({ failedOnly, limit: 100 }),
    listOptOuts(200),
  ]);

  return (
    <PlatformShell
      title="SMS & opt-outs"
      subtitle="Recent texts and numbers that asked to stop"
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="space-y-6">
        <Panel>
          <SectionHeader title="Add an opt-out" />
          <p className="mb-3 text-sm text-muted-foreground">
            For buyers who ask by chat, email or call. Applies to every shop. &ldquo;Reminders
            only&rdquo; keeps order updates; &ldquo;All texts&rdquo; stops those too.
          </p>
          <AddOptOutForm />
        </Panel>

        <Panel className="!p-0">
          <div className="px-5 pt-5">
            <SectionHeader title={`Opted out (${optOuts.length})`} />
          </div>
          {optOuts.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No opt-outs yet" hint="" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Number</th>
                  <th className="px-5 py-3 font-semibold">Stops</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {optOuts.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3 font-medium tabular-nums">{mask(o.phone)}</td>
                    <td className="px-5 py-3">{o.scope === "all" ? "All texts" : "Reminders"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.source === "STOP" ? "Buyer link" : "Support"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <RemoveOptOutButton id={o.id} label={mask(o.phone)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel className="!p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <SectionHeader title={failedOnly ? "Failed texts" : "Recent texts"} />
            <a href={failedOnly ? "/messaging" : "/messaging?failed=1"} className="text-sm text-primary hover:underline">
              {failedOnly ? "Show all" : "Failures only"}
            </a>
          </div>
          {messages.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="Nothing sent yet" hint="" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-5 py-3 font-semibold">Recipe</th>
                    <th className="px-5 py-3 font-semibold">To</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {messages.map((m) => (
                    <tr key={m.id}>
                      <td className="px-5 py-3 text-muted-foreground">{formatDateTime(m.createdAt)}</td>
                      <td className="px-5 py-3">{m.recipe.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3 tabular-nums">{mask(m.recipient)}</td>
                      <td className="px-5 py-3"><StatusPill status={m.status} /></td>
                      <td className="max-w-xs truncate px-5 py-3 text-xs text-muted-foreground" title={m.error ?? ""}>
                        {m.error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </PlatformShell>
  );
}
